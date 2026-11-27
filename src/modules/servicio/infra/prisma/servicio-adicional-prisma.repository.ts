import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { ServicioAdicionalEntity } from '../../domain/entities/servicio-adicional.entity';
import { ServicioAdicionalModificadoError } from '../../domain/errors/servicio.errors';
import {
  ServicioAdicionalRepositoryPort,
  UsoServicioAdicional,
} from '../../domain/ports/servicio-adicional-repository.port';
import { ServicioAdicionalPrismaMapper } from './servicio-adicional-prisma.mapper';

@Injectable()
export class ServicioAdicionalPrismaRepository
  implements ServicioAdicionalRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async findById(id: number): Promise<ServicioAdicionalEntity | null> {
    const record = await this.db.servicio.findUnique({ where: { id } });

    return record ? ServicioAdicionalPrismaMapper.toDomain(record) : null;
  }

  async create(
    entity: ServicioAdicionalEntity,
  ): Promise<ServicioAdicionalEntity> {
    const record = await this.db.servicio.create({
      data: ServicioAdicionalPrismaMapper.toCreatePersistence(entity),
    });

    return ServicioAdicionalPrismaMapper.toDomain(record);
  }

  async update(
    entity: ServicioAdicionalEntity,
  ): Promise<ServicioAdicionalEntity> {
    const { count } = await this.db.servicio.updateMany({
      where: { id: entity.id!, eliminadoEn: null },
      data: ServicioAdicionalPrismaMapper.toUpdatePersistence(entity),
    });
    if (count !== 1) throw new ServicioAdicionalModificadoError();

    return entity;
  }

  async bloquearNombres(): Promise<void> {
    await this.db
      .$executeRaw`SELECT pg_advisory_xact_lock(hashtext('Servicio.nombre'))`;
  }

  async existeNombre(nombre: string, excluirId?: number): Promise<boolean> {
    // `lower` y no ILIKE: un "_" o "%" del nombre no debe actuar de comodín.
    const filas = await this.db.$queryRaw<{ id: number }[]>`
      SELECT "id" FROM "Servicio"
      WHERE "eliminadoEn" IS NULL
        AND lower(btrim("nombre")) = lower(btrim(${nombre}))
        AND "id" <> ${excluirId ?? 0}
      LIMIT 1`;

    return filas.length > 0;
  }

  async bloquearParaAsignar(id: number): Promise<void> {
    // Compartido: varias asignaciones conviven; un cambio o borrado espera.
    await this.db
      .$queryRaw`SELECT "id" FROM "Servicio" WHERE "id" = ${id} FOR SHARE`;
  }

  async bloquearParaModificar(id: number): Promise<void> {
    await this.db
      .$queryRaw`SELECT "id" FROM "Servicio" WHERE "id" = ${id} FOR UPDATE`;
  }

  async clienteTieneServicio(
    servicioId: number,
    clienteId: number,
  ): Promise<boolean> {
    const asignaciones = await this.db.clienteServicio.count({
      where: { servicioId, clienteId },
    });

    return asignaciones > 0;
  }

  async contarUso(id: number): Promise<UsoServicioAdicional> {
    const [clientes, facturas] = await Promise.all([
      this.db.clienteServicio.count({ where: { servicioId: id } }),
      this.db.facturaServicio.count({ where: { servicioId: id } }),
    ]);

    return { clientes, facturas };
  }

  async eliminar(entity: ServicioAdicionalEntity): Promise<void> {
    const props = entity.toPrimitives();

    // Las condiciones repiten la comprobación en la misma sentencia: un borrado
    // en la base arrastraría las asignaciones y las líneas de factura.
    const { count } = await this.db.servicio.updateMany({
      where: {
        id: entity.id!,
        eliminadoEn: null,
        clientes: { none: {} },
        FacturaServicio: { none: {} },
      },
      data: {
        estado: ServicioAdicionalPrismaMapper.estadoPersistido(props.estado),
        eliminadoEn: props.eliminadoEn,
        eliminadoPorId: props.eliminadoPorId,
        actualizadoEn: props.actualizadoEn,
      },
    });
    if (count !== 1) throw new ServicioAdicionalModificadoError();
  }
}
