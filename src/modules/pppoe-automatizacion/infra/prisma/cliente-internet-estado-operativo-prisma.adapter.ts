import { ConflictException, Injectable } from '@nestjs/common';

import { EstadoCliente, TipoCambioEstadoCliente } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

import {
  ClienteInternetEstadoOperativoPort,
  EstadoOperativoClienteInternet,
  SincronizarEstadoOperativoClienteParams,
} from '../../domain/ports/cliente-internet-estado-operativo.port';

@Injectable()
export class ClienteInternetEstadoOperativoPrismaAdapter
  implements ClienteInternetEstadoOperativoPort
{
  constructor(private readonly prisma: PrismaService) {}

  async sincronizar(
    params: SincronizarEstadoOperativoClienteParams,
  ): Promise<void> {
    const estadoNuevo = this.mapEstado(params.estado);

    await this.prisma.$transaction(async (tx) => {
      /*
       * Buscamos el cliente dentro de la empresa
       * y excluimos registros eliminados.
       */
      const cliente = await tx.clienteInternet.findFirst({
        where: {
          id: params.clienteId,

          empresaId: params.empresaId,

          isEliminado: false,
        },

        select: {
          id: true,

          estadoCliente: true,
        },
      });

      if (!cliente) {
        throw new ConflictException(
          `No existe un cliente operativo ${params.clienteId} para la empresa ${params.empresaId}.`,
        );
      }

      /*
       * Idempotencia local:
       *
       * Si ya se encuentra en el estado esperado,
       * no escribimos nuevamente ni duplicamos historial.
       */
      if (cliente.estadoCliente === estadoNuevo) {
        return;
      }

      const estadoAnterior = cliente.estadoCliente;

      /*
       * Guardamos el cambio usando el estado anterior
       * como condición optimista.
       *
       * Si otro flujo modificó al cliente en paralelo,
       * no sobrescribimos silenciosamente ese cambio.
       */
      const updated = await tx.clienteInternet.updateMany({
        where: {
          id: cliente.id,

          empresaId: params.empresaId,

          isEliminado: false,

          estadoCliente: estadoAnterior,
        },

        data: {
          estadoCliente: estadoNuevo,
        },
      });

      if (updated.count !== 1) {
        throw new ConflictException(
          `El estado operativo del cliente ${cliente.id} cambió durante la sincronización PPPoE.`,
        );
      }

      /*
       * El cambio operativo queda registrado
       * en el historial general del cliente.
       *
       * estadoCobranza NO se modifica.
       */
      await tx.clienteEstadoHistorial.create({
        data: {
          empresaId: params.empresaId,

          clienteId: cliente.id,

          tipoCambio: TipoCambioEstadoCliente.CAMBIO_ESTADO,

          estadoAnterior,

          estadoNuevo,

          motivo: params.motivo?.trim() || null,

          descripcion: params.descripcion?.trim() || null,

          cambiadoPorId: params.cambiadoPorId ?? null,
        },
      });
    });
  }

  private mapEstado(estado: EstadoOperativoClienteInternet): EstadoCliente {
    switch (estado) {
      case EstadoOperativoClienteInternet.ACTIVO:
        return EstadoCliente.ACTIVO;

      case EstadoOperativoClienteInternet.SUSPENDIDO:
        return EstadoCliente.SUSPENDIDO;
    }
  }
}
