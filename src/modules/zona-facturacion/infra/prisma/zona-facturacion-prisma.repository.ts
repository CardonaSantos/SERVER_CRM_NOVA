import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { ZonaFacturacionEntity } from '../../domain/entities/zona-facturacion.entity';
import { ZonaFacturacionModificadaError } from '../../domain/errors/zona-facturacion.errors';
import {
  UsoZonaFacturacion,
  ZonaFacturacionRepositoryPort,
} from '../../domain/ports/zona-facturacion-repository.port';
import { ZonaFacturacionPrismaMapper } from './zona-facturacion-prisma.mapper';

@Injectable()
export class ZonaFacturacionPrismaRepository
  implements ZonaFacturacionRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async findById(id: number): Promise<ZonaFacturacionEntity | null> {
    const record = await this.db.facturacionZona.findUnique({ where: { id } });

    return record ? ZonaFacturacionPrismaMapper.toDomain(record) : null;
  }

  async create(entity: ZonaFacturacionEntity): Promise<ZonaFacturacionEntity> {
    const record = await this.db.facturacionZona.create({
      data: ZonaFacturacionPrismaMapper.toCreatePersistence(entity),
    });

    return ZonaFacturacionPrismaMapper.toDomain(record);
  }

  async update(entity: ZonaFacturacionEntity): Promise<ZonaFacturacionEntity> {
    const { count } = await this.db.facturacionZona.updateMany({
      where: { id: entity.id!, eliminadoEn: null },
      data: ZonaFacturacionPrismaMapper.toUpdatePersistence(entity),
    });
    if (count !== 1) throw new ZonaFacturacionModificadaError();

    return entity;
  }

  async contarUso(id: number): Promise<UsoZonaFacturacion> {
    const [clientes, facturas] = await Promise.all([
      this.db.clienteInternet.count({ where: { facturacionZonaId: id } }),
      this.db.facturaInternet.count({ where: { facturacionZonaId: id } }),
    ]);

    return { clientes, facturas };
  }

  async bloquearParaAsignar(id: number): Promise<void> {
    // Compartido: varias asignaciones conviven; un borrado espera.
    await this.db
      .$queryRaw`SELECT "id" FROM "FacturacionZona" WHERE "id" = ${id} FOR SHARE`;
  }

  eliminar(entity: ZonaFacturacionEntity): Promise<void> {
    const props = entity.toPrimitives();

    return this.transaccional.ejecutar(async () => {
      // Primero se bloquea la fila: espera a quien esté asignando un cliente,
      // y la sentencia siguiente ya lo ve.
      await this.db
        .$queryRaw`SELECT "id" FROM "FacturacionZona" WHERE "id" = ${entity.id!} FOR UPDATE`;

      const { count } = await this.db.facturacionZona.updateMany({
        where: {
          id: entity.id!,
          eliminadoEn: null,
          clientes: { none: {} },
          facturas: { none: {} },
        },
        data: {
          eliminadoEn: props.eliminadoEn,
          eliminadoPorId: props.eliminadoPorId,
          actualizadoEn: props.actualizadoEn,
        },
      });
      if (count !== 1) throw new ZonaFacturacionModificadaError();
    });
  }
}
