import { Inject, Injectable } from '@nestjs/common';
import {
  CLIENTE_COBRANZA,
  ClienteCobranzaFacadePort,
  EstadoCobranzaCliente,
} from '../../../cliente-cobranza/public/cliente-cobranza.facade.port';
import {
  FACTURA_REPOSITORY,
  FacturaRepositoryPort,
} from '../../domain/ports/factura-repository.port';

/**
 * Todo movimiento de facturas o pagos empieza bloqueando al cliente y termina
 * recalculando su cobranza, dentro de la misma unidad de trabajo.
 */
@Injectable()
export class CobranzaDelClienteService {
  constructor(
    @Inject(CLIENTE_COBRANZA)
    private readonly cobranza: ClienteCobranzaFacadePort,
    @Inject(FACTURA_REPOSITORY)
    private readonly facturas: FacturaRepositoryPort,
  ) {}

  bloquear(clienteId: number): Promise<void> {
    return this.cobranza.bloquear(clienteId);
  }

  async recalcular(clienteId: number): Promise<EstadoCobranzaCliente> {
    const facturasPendientes = await this.facturas.contarPendientes(clienteId);

    return this.cobranza.actualizar({ clienteId, facturasPendientes });
  }
}
