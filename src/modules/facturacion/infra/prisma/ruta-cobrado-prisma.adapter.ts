import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { RutaCobradoPort } from '../../application/ports/ruta-cobrado.port';

/** Transitorio: escribe en la tabla de `ruta-cobro` hasta que tenga fachada. */
@Injectable()
export class RutaCobradoPrismaAdapter implements RutaCobradoPort {
  constructor(private readonly transaccional: PrismaTransaccional) {}

  async ajustar(rutaId: number, monto: number): Promise<boolean> {
    const { count } = await this.transaccional.cliente.ruta.updateMany({
      where: { id: rutaId },
      data: { montoCobrado: { increment: monto } },
    });

    return count === 1;
  }
}
