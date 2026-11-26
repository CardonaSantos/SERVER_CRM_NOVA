import { Inject, Injectable } from '@nestjs/common';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { EstadoOperativoCliente } from '../../domain/enums/estado-operativo-cliente.enum';
import { TipoCambioCliente } from '../../domain/enums/tipo-cambio-cliente.enum';
import { ClienteNoEncontradoError } from '../../domain/errors/cliente.errors';
import {
  CLIENTE_REPOSITORY,
  ClienteRepositoryPort,
} from '../../domain/ports/cliente-repository.port';

export type SincronizarEstadoOperativoClienteInput = {
  empresaId: number;
  clienteId: number;
  estado: EstadoOperativoCliente.ACTIVO | EstadoOperativoCliente.SUSPENDIDO;
  cambiadoPorId?: number | null;
  motivo?: string | null;
  descripcion?: string | null;
};

/**
 * Lleva al cliente el estado que PPPoE confirmó en el router y lo anota en su
 * historial. Idempotente. No toca la cobranza.
 */
@Injectable()
export class SincronizarEstadoOperativoClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clientes: ClienteRepositoryPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
  ) {}

  execute(input: SincronizarEstadoOperativoClienteInput): Promise<void> {
    return this.unidad.ejecutar(async () => {
      const cliente = await this.clientes.findById(input.clienteId);

      if (
        !cliente ||
        cliente.isEliminado ||
        cliente.empresaId !== input.empresaId
      ) {
        throw new ClienteNoEncontradoError();
      }

      const estadoAnterior = cliente.estadoCliente;
      if (!cliente.sincronizarEstadoOperativo(input.estado)) return;

      await this.clientes.update(cliente);
      await this.clientes.registrarCambio({
        empresaId: input.empresaId,
        clienteId: input.clienteId,
        tipoCambio:
          estadoAnterior === EstadoOperativoCliente.DESINSTALADO
            ? TipoCambioCliente.REINSTALACION
            : TipoCambioCliente.CAMBIO_ESTADO,
        estadoAnterior,
        estadoNuevo: input.estado,
        motivo: input.motivo?.trim() || null,
        descripcion: input.descripcion?.trim() || null,
        cambiadoPorId: input.cambiadoPorId ?? null,
      });
    });
  }
}
