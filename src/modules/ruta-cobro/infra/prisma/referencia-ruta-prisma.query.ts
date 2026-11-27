import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { ReferenciaRutaQueryPort } from '../../domain/ports/referencia-ruta-query.port';

@Injectable()
export class ReferenciaRutaPrismaQuery implements ReferenciaRutaQueryPort {
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async existeCobradorActivo(usuarioId: number): Promise<boolean> {
    return (
      (await this.db.usuario.count({
        where: { id: usuarioId, activo: true },
      })) > 0
    );
  }

  contarClientesAsignables(clienteIds: number[]): Promise<number> {
    return this.db.clienteInternet.count({
      where: { id: { in: clienteIds }, isEliminado: false },
    });
  }
}
