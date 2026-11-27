import { Injectable } from '@nestjs/common';
import { EstadoCobranzaCliente as EstadoCobranzaPrisma } from '@prisma/client';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { EstadoCobranzaCliente } from '../../../cliente/public/cliente.types';
import { ClienteCobranzaRepositoryPort } from '../../domain/ports/cliente-cobranza-repository.port';

@Injectable()
export class ClienteCobranzaPrismaRepository
  implements ClienteCobranzaRepositoryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async bloquear(clienteId: number): Promise<void> {
    // No impide crear filas que apunten al cliente; sí otro movimiento suyo.
    await this.db
      .$queryRaw`SELECT "id" FROM "ClienteInternet" WHERE "id" = ${clienteId} FOR NO KEY UPDATE`;
  }

  async guardar(
    clienteId: number,
    estado: EstadoCobranzaCliente,
  ): Promise<void> {
    await this.db.clienteInternet.update({
      where: { id: clienteId },
      data: { estadoCobranza: estado as string as EstadoCobranzaPrisma },
    });
  }
}
