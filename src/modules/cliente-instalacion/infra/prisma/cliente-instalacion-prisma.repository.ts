import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { ClienteInstalacionEntity } from '../../domain/entities/cliente-instalacion.entity';
import { ClienteInstalacionTecnicoInvalidoError } from '../../domain/errors/cliente-instalacion.errors';
import {
  ActualizarTecnicoInstalacionInput,
  BuscarInstalacionAsignadaTecnicoParams,
  ClienteInstalacionRepositoryPort,
  CrearTecnicoInstalacionInput,
} from '../../domain/ports/cliente-instalacion-repository.port';
import { ClienteInstalacionPrismaMapper } from './cliente-instalacion-prisma.mapper';

@Injectable()
export class ClienteInstalacionPrismaRepository
  implements ClienteInstalacionRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  /** La transacción abierta por una unidad de trabajo, o el cliente normal. */
  private get db() {
    return this.transaccional.cliente;
  }

  async create(
    entity: ClienteInstalacionEntity,
    tecnicos: CrearTecnicoInstalacionInput[] = [],
  ): Promise<ClienteInstalacionEntity> {
    const data = ClienteInstalacionPrismaMapper.toCreatePersistence(entity);
    const nombres = await this.nombresDeTecnicos(tecnicos);

    const record = await this.db.clienteInstalacion.create({
      data: {
        ...data,
        tecnicos:
          tecnicos.length > 0
            ? {
                create: tecnicos.map((tecnico) => ({
                  tecnicoId: tecnico.tecnicoId,
                  rol: tecnico.rol,
                  esResponsable: tecnico.esResponsable,
                  observaciones: tecnico.observaciones ?? null,
                  tecnicoNombreSnapshot: nombres.get(tecnico.tecnicoId) ?? null,
                })),
              }
            : undefined,
      },
    });

    return ClienteInstalacionPrismaMapper.toDomain(record);
  }

  async findById(id: number): Promise<ClienteInstalacionEntity | null> {
    const record = await this.db.clienteInstalacion.findUnique({
      where: { id },
    });

    return record ? ClienteInstalacionPrismaMapper.toDomain(record) : null;
  }

  async save(
    entity: ClienteInstalacionEntity,
    tecnicos?: ActualizarTecnicoInstalacionInput[],
  ): Promise<ClienteInstalacionEntity> {
    const id = entity.id;

    if (id === undefined) {
      throw new Error('No se puede guardar una instalación sin id.');
    }

    const data = ClienteInstalacionPrismaMapper.toUpdatePersistence(entity);

    if (tecnicos === undefined) {
      const record = await this.db.clienteInstalacion.update({
        where: { id },
        data,
      });

      return ClienteInstalacionPrismaMapper.toDomain(record);
    }

    // Validar antes de escribir: las asignaciones anteriores no se tocan si
    // alguna nueva es inválida. El reemplazo va en un solo update anidado, que
    // Prisma ejecuta de forma atómica.
    const nombres = await this.nombresDeTecnicos(tecnicos);

    const record = await this.db.clienteInstalacion.update({
      where: { id },
      data: {
        ...data,
        tecnicos: {
          deleteMany: {},
          create: tecnicos.map((tecnico) => ({
            tecnicoId: tecnico.tecnicoId,
            rol: tecnico.rol,
            esResponsable: tecnico.esResponsable,
            tiempoMinutos: tecnico.tiempoMinutos ?? null,
            observaciones: tecnico.observaciones ?? null,
            tecnicoNombreSnapshot: nombres.get(tecnico.tecnicoId) ?? null,
          })),
        },
      },
    });

    return ClienteInstalacionPrismaMapper.toDomain(record);
  }

  async findByIdAssignedToTechnician(
    params: BuscarInstalacionAsignadaTecnicoParams,
  ): Promise<ClienteInstalacionEntity | null> {
    const record = await this.db.clienteInstalacion.findFirst({
      where: {
        id: params.instalacionId,
        tecnicos: { some: { tecnicoId: params.tecnicoId } },
      },
    });

    return record ? ClienteInstalacionPrismaMapper.toDomain(record) : null;
  }

  /** Nombre de cada técnico activo; falla si alguno no existe o está inactivo. */
  private async nombresDeTecnicos(
    tecnicos: { tecnicoId: number }[],
  ): Promise<Map<number, string>> {
    const ids = tecnicos.map((tecnico) => tecnico.tecnicoId);

    if (ids.length === 0) {
      return new Map();
    }

    const usuarios = await this.db.usuario.findMany({
      where: { id: { in: ids }, activo: true },
      select: { id: true, nombre: true },
    });

    if (usuarios.length !== new Set(ids).size) {
      throw new ClienteInstalacionTecnicoInvalidoError(
        'Uno o más técnicos no existen o están inactivos.',
      );
    }

    return new Map(usuarios.map((usuario) => [usuario.id, usuario.nombre]));
  }
}
