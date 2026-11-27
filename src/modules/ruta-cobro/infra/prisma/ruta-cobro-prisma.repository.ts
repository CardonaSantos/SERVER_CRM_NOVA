import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { RutaCobroEntity } from '../../domain/entities/ruta-cobro.entity';
import { RutaCobroRepositoryPort } from '../../domain/ports/ruta-cobro-repository.port';
import { RutaCobroPrismaMapper } from './ruta-cobro-prisma.mapper';

const CON_CLIENTES = { clientes: { select: { id: true } } } as const;

@Injectable()
export class RutaCobroPrismaRepository implements RutaCobroRepositoryPort {
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async bloquearParaModificar(id: number): Promise<void> {
    await this.db
      .$queryRaw`SELECT "id" FROM "Ruta" WHERE "id" = ${id} FOR NO KEY UPDATE`;
  }

  async bloquearParaCobrar(id: number): Promise<void> {
    // Compartido: varios cobros conviven; cerrar, editar o eliminar esperan.
    await this.db
      .$queryRaw`SELECT "id" FROM "Ruta" WHERE "id" = ${id} FOR SHARE`;
  }

  async findById(id: number): Promise<RutaCobroEntity | null> {
    const record = await this.db.ruta.findUnique({
      where: { id },
      include: CON_CLIENTES,
    });

    return record ? RutaCobroPrismaMapper.toDomain(record) : null;
  }

  async create(entity: RutaCobroEntity): Promise<RutaCobroEntity> {
    const record = await this.db.ruta.create({
      data: RutaCobroPrismaMapper.toCreatePersistence(entity),
      include: CON_CLIENTES,
    });

    return RutaCobroPrismaMapper.toDomain(record);
  }

  async update(
    entity: RutaCobroEntity,
    opciones: { clientes: boolean } = { clientes: false },
  ): Promise<void> {
    await this.db.ruta.update({
      where: { id: entity.id! },
      data: RutaCobroPrismaMapper.toUpdatePersistence(entity, opciones),
    });
  }
}
