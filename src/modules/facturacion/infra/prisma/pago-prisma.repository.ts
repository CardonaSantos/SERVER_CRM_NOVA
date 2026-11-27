import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { PagoEntity } from '../../domain/entities/pago.entity';
import { PagoBoletaDuplicadaError } from '../../domain/errors/facturacion.errors';
import {
  EliminacionPago,
  PagoRepositoryPort,
} from '../../domain/ports/pago-repository.port';
import { PagoPrismaMapper } from './pago-prisma.mapper';

@Injectable()
export class PagoPrismaRepository implements PagoRepositoryPort {
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async findById(id: number): Promise<PagoEntity | null> {
    const record = await this.db.pagoFacturaInternet.findUnique({
      where: { id },
    });

    return record ? PagoPrismaMapper.toDomain(record) : null;
  }

  async create(entity: PagoEntity): Promise<PagoEntity> {
    try {
      const record = await this.db.pagoFacturaInternet.create({
        data: PagoPrismaMapper.toCreatePersistence(entity),
      });

      return PagoPrismaMapper.toDomain(record);
    } catch (error) {
      // El número de boleta es el único valor irrepetible que se escribe aquí.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new PagoBoletaDuplicadaError();
      }
      throw error;
    }
  }

  async existeNumeroBoleta(clave: string): Promise<boolean> {
    const filas = await this.db.$queryRaw<unknown[]>`
      SELECT 1 FROM "PagoFacturaInternet"
      WHERE lower(regexp_replace("numeroBoleta", '[[:space:]]', '', 'g')) = ${clave}
      LIMIT 1`;

    return filas.length > 0;
  }

  async eliminar(id: number): Promise<void> {
    await this.db.pagoFacturaInternet.delete({ where: { id } });
  }

  async registrarEliminacion({
    pago,
    usuarioId,
    motivo,
    fecha,
  }: EliminacionPago): Promise<void> {
    const p = pago.toPrimitives();

    await this.db.pagoEliminado.create({
      data: {
        pagoId: p.id!,
        facturaInternetId: p.facturaId,
        clienteId: p.clienteId,
        montoPagado: p.montoPagado,
        metodoPago: PagoPrismaMapper.metodo(p.metodoPago),
        fechaPago: p.fechaPago,
        pagoCreadoEn: p.creadoEn,
        cobradorId: p.cobradorId,
        numeroBoleta: p.numeroBoleta,
        codigoConfirmacion: p.codigoConfirmacion,
        origen: PagoPrismaMapper.origen(p.origen),
        rutaId: p.rutaId,
        motivo,
        eliminadoPorId: usuarioId,
        eliminadoEn: fecha,
      },
    });
  }
}
