import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { SectorEntity } from '../../domain/entities/sector.entity';
import { SectorModificadoError } from '../../domain/errors/ubicacion.errors';
import { SectorRepositoryPort } from '../../domain/ports/sector-repository.port';
import { SectorPrismaMapper } from './sector-prisma.mapper';

@Injectable()
export class SectorPrismaRepository implements SectorRepositoryPort {
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async findById(id: number): Promise<SectorEntity | null> {
    const record = await this.db.sector.findUnique({ where: { id } });

    return record ? SectorPrismaMapper.toDomain(record) : null;
  }

  async create(entity: SectorEntity): Promise<SectorEntity> {
    const record = await this.db.sector.create({
      data: SectorPrismaMapper.toCreatePersistence(entity),
    });

    return SectorPrismaMapper.toDomain(record);
  }

  async update(entity: SectorEntity): Promise<SectorEntity> {
    const { count } = await this.db.sector.updateMany({
      where: { id: entity.id!, eliminadoEn: null },
      data: SectorPrismaMapper.toUpdatePersistence(entity),
    });
    if (count !== 1) throw new SectorModificadoError();

    return entity;
  }

  async bloquearNombres(): Promise<void> {
    await this.db
      .$executeRaw`SELECT pg_advisory_xact_lock(hashtext('Sector.nombre'))`;
  }

  async existeNombre(
    nombre: string,
    municipioId: number,
    excluirId?: number,
  ): Promise<boolean> {
    // `lower` y no ILIKE: un "_" o "%" del nombre no debe actuar de comodín.
    const filas = await this.db.$queryRaw<{ id: number }[]>`
      SELECT "id" FROM "Sector"
      WHERE "eliminadoEn" IS NULL
        AND "municipioId" = ${municipioId}
        AND lower(btrim("nombre")) = lower(btrim(${nombre}))
        AND "id" <> ${excluirId ?? 0}
      LIMIT 1`;

    return filas.length > 0;
  }

  async bloquearParaAsignar(id: number): Promise<void> {
    // Compartido: varias asignaciones conviven; un cambio o borrado espera.
    await this.db
      .$queryRaw`SELECT "id" FROM "Sector" WHERE "id" = ${id} FOR SHARE`;
  }

  async bloquearParaModificar(id: number): Promise<void> {
    await this.db
      .$queryRaw`SELECT "id" FROM "Sector" WHERE "id" = ${id} FOR UPDATE`;
  }

  contarClientes(id: number): Promise<number> {
    return this.db.clienteInternet.count({ where: { sectorId: id } });
  }

  async eliminar(entity: SectorEntity): Promise<void> {
    const props = entity.toPrimitives();

    // La condición repite la comprobación en la misma sentencia: la base
    // dejaría sin sector a los clientes, en vez de impedir el borrado.
    const { count } = await this.db.sector.updateMany({
      where: { id: entity.id!, eliminadoEn: null, clientes: { none: {} } },
      data: {
        eliminadoEn: props.eliminadoEn,
        eliminadoPorId: props.eliminadoPorId,
        actualizadoEn: props.actualizadoEn,
      },
    });
    if (count !== 1) throw new SectorModificadoError();
  }
}
