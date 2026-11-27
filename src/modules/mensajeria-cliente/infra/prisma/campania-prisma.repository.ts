import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { CampaniaEntity } from '../../domain/entities/campania.entity';
import { MotivoEnvio } from '../../domain/enums/campania.enum';
import {
  CampaniaEnCursoError,
  CampaniaNoReanudableError,
} from '../../domain/errors/mensajeria-cliente.errors';
import { limiteDeActividad } from '../../domain/policies/campania.policy';
import { DestinoCampania } from '../../domain/policies/destinatarios.policy';
import {
  CampaniaRepositoryPort,
  EnvioReclamado,
  ResultadoEnvio,
} from '../../domain/ports/campania-repository.port';
import { CampaniaPrismaMapper } from './campania-prisma.mapper';

@Injectable()
export class CampaniaPrismaRepository implements CampaniaRepositoryPort {
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  crear(
    campania: CampaniaEntity,
    destinos: DestinoCampania[],
    ahora: Date,
  ): Promise<number> {
    return this.transaccional.ejecutar(async () => {
      await this.exigirQueNingunaEsteEnviando(ahora);

      const { id } = await this.db.campaniaMensaje.create({
        data: CampaniaPrismaMapper.toCreatePersistence(campania),
        select: { id: true },
      });
      await this.db.envioCampaniaMensaje.createMany({
        data: destinos.map((destino) => ({ ...destino, campaniaId: id })),
      });
      return id;
    });
  }

  async findById(id: number): Promise<CampaniaEntity | null> {
    const record = await this.db.campaniaMensaje.findUnique({ where: { id } });
    return record ? CampaniaPrismaMapper.toDomain(record) : null;
  }

  reanudar(campania: CampaniaEntity, ahora: Date): Promise<void> {
    const id = campania.id!;
    return this.transaccional.ejecutar(async () => {
      // Esta pasa a interrumpida si estaba detenida; otra en curso la frena.
      await this.exigirQueNingunaEsteEnviando(ahora);

      const { estado, actividadEn } = campania.toPrimitives();
      const { count } = await this.db.campaniaMensaje.updateMany({
        where: { id, estado: 'INTERRUMPIDA' },
        data: { estado, actividadEn },
      });
      if (count !== 1) throw new CampaniaNoReanudableError();

      await this.db.envioCampaniaMensaje.updateMany({
        where: { campaniaId: id, estado: 'ENVIANDO' },
        data: {
          estado: 'SIN_CONFIRMAR',
          motivo: MotivoEnvio.ENVIO_SIN_CONFIRMAR,
        },
      });
    });
  }

  tomarSiguiente(
    campaniaId: number,
    ahora: Date,
  ): Promise<EnvioReclamado | null> {
    return this.transaccional.ejecutar(async () => {
      const { count } = await this.db.campaniaMensaje.updateMany({
        where: { id: campaniaId, estado: 'EN_CURSO' },
        data: { actividadEn: ahora },
      });
      if (count !== 1) return null;

      const envio = await this.db.envioCampaniaMensaje.findFirst({
        where: { campaniaId, estado: 'PENDIENTE' },
        orderBy: { id: 'asc' },
        select: { id: true, telefono: true },
      });
      if (!envio?.telefono) return null;

      const reclamo = await this.db.envioCampaniaMensaje.updateMany({
        where: { id: envio.id, estado: 'PENDIENTE' },
        data: { estado: 'ENVIANDO', intentadoEn: ahora },
      });
      return reclamo.count === 1
        ? { id: envio.id, telefono: envio.telefono }
        : null;
    });
  }

  async registrarResultado(
    envioId: number,
    resultado: ResultadoEnvio,
  ): Promise<void> {
    await this.db.envioCampaniaMensaje.updateMany({
      where: { id: envioId, estado: 'ENVIANDO' },
      data: {
        estado: resultado.estado,
        motivo: resultado.motivo ?? null,
        detalle: resultado.detalle ?? null,
        mensajeProveedorId: resultado.mensajeProveedorId ?? null,
      },
    });
  }

  async interrumpir(campaniaId: number, ahora: Date): Promise<void> {
    await this.db.campaniaMensaje.updateMany({
      where: { id: campaniaId, estado: 'EN_CURSO' },
      data: { estado: 'INTERRUMPIDA', actividadEn: ahora },
    });
  }

  async completar(campaniaId: number, ahora: Date): Promise<void> {
    await this.db.campaniaMensaje.updateMany({
      where: {
        id: campaniaId,
        estado: 'EN_CURSO',
        envios: { none: { estado: { in: ['PENDIENTE', 'ENVIANDO'] } } },
      },
      data: { estado: 'COMPLETADA', actividadEn: ahora, finalizadaEn: ahora },
    });
  }

  /**
   * Solo una campaña envía a la vez. El candado dura la transacción, así dos
   * solicitudes simultáneas no pasan ambas la comprobación.
   */
  private async exigirQueNingunaEsteEnviando(ahora: Date): Promise<void> {
    await this.db
      .$executeRaw`SELECT pg_advisory_xact_lock(hashtext('campania_mensaje'))`;

    await this.db.campaniaMensaje.updateMany({
      where: {
        estado: 'EN_CURSO',
        actividadEn: { lt: limiteDeActividad(ahora) },
      },
      data: { estado: 'INTERRUMPIDA' },
    });
    const enCurso = await this.db.campaniaMensaje.count({
      where: { estado: 'EN_CURSO' },
    });
    if (enCurso > 0) throw new CampaniaEnCursoError();
  }
}
