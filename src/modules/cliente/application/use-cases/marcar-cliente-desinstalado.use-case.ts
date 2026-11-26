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

export type MarcarClienteDesinstaladoInput = {
  empresaId: number;
  clienteId: number;
  /** Cuándo se retiró el servicio. */
  fecha: Date;
  cambiadoPorId?: number | null;
  motivo?: string | null;
  descripcion?: string | null;
};

/**
 * Deja al cliente DESINSTALADO, con lo que sale de la facturación automática.
 * Idempotente: conserva la primera fecha de baja.
 */
@Injectable()
export class MarcarClienteDesinstaladoUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clientes: ClienteRepositoryPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
  ) {}

  execute(input: MarcarClienteDesinstaladoInput): Promise<void> {
    return this.unidad.ejecutar(async () => {
      const cliente = await this.clientes.findById(input.clienteId);
      if (!cliente) throw new ClienteNoEncontradoError();

      const estadoAnterior = cliente.estadoCliente;
      if (!cliente.marcarDesinstalado(input.fecha)) return;

      await this.clientes.update(cliente);
      await this.clientes.registrarCambio({
        empresaId: input.empresaId,
        clienteId: input.clienteId,
        tipoCambio: TipoCambioCliente.DESINSTALACION,
        estadoAnterior,
        estadoNuevo: EstadoOperativoCliente.DESINSTALADO,
        motivo: input.motivo?.trim() || null,
        descripcion: input.descripcion?.trim() || null,
        cambiadoPorId: input.cambiadoPorId ?? null,
      });
    });
  }
}
