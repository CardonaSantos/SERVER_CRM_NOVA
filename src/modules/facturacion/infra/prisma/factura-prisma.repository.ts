import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { FacturaEntity } from '../../domain/entities/factura.entity';
import { ESTADOS_CON_DEUDA } from '../../domain/enums/estado-factura.enum';
import {
  FacturaDuplicadaError,
  FacturaModificadaError,
} from '../../domain/errors/facturacion.errors';
import {
  EliminacionFactura,
  FacturaRepositoryPort,
} from '../../domain/ports/factura-repository.port';
import { CON_PAGOS, FacturaPrismaMapper } from './factura-prisma.mapper';

@Injectable()
export class FacturaPrismaRepository implements FacturaRepositoryPort {
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async findById(id: number): Promise<FacturaEntity | null> {
    const record = await this.db.facturaInternet.findUnique({
      where: { id },
      include: CON_PAGOS,
    });

    return record ? FacturaPrismaMapper.toDomain(record) : null;
  }

  async create(entity: FacturaEntity): Promise<FacturaEntity> {
    try {
      const record = await this.db.facturaInternet.create({
        data: FacturaPrismaMapper.toCreatePersistence(entity),
        include: CON_PAGOS,
      });

      return FacturaPrismaMapper.toDomain(record);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new FacturaDuplicadaError();
      }
      throw error;
    }
  }

  async update(entity: FacturaEntity): Promise<void> {
    const { count } = await this.db.facturaInternet.updateMany({
      where: { id: entity.id! },
      data: FacturaPrismaMapper.toUpdatePersistence(entity),
    });
    if (count !== 1) throw new FacturaModificadaError();
  }

  async eliminar(id: number): Promise<void> {
    // La condición evita arrastrar pagos: la llave foránea los borraría.
    const { count } = await this.db.facturaInternet.deleteMany({
      where: { id, pagos: { none: {} } },
    });
    if (count !== 1) throw new FacturaModificadaError();
  }

  async registrarEliminacion({
    factura,
    usuarioId,
    motivo,
    fecha,
  }: EliminacionFactura): Promise<void> {
    const p = factura.toPrimitives();

    await this.db.facturaEliminada.create({
      data: {
        facturaInternetId: p.id,
        facturaOriginalId: p.id,
        clienteId: p.clienteId,
        periodo: p.periodo,
        montoPago: p.montoPago,
        fechaPagoEsperada: p.fechaPagoEsperada ?? p.creadoEn,
        usuarioId,
        motivo,
        fechaEliminacion: fecha,
      },
    });
  }

  async periodosEmitidos(
    clienteId: number,
    periodos: string[],
  ): Promise<string[]> {
    const records = await this.db.facturaInternet.findMany({
      where: { clienteId, periodo: { in: periodos } },
      select: { periodo: true },
      distinct: ['periodo'],
      orderBy: { periodo: 'asc' },
    });

    return records.map((record) => record.periodo);
  }

  contarPendientes(clienteId: number): Promise<number> {
    return this.db.facturaInternet.count({
      where: {
        clienteId,
        estadoFacturaInternet: {
          in: ESTADOS_CON_DEUDA.map((e) => FacturaPrismaMapper.estado(e)),
        },
      },
    });
  }
}
