import { Inject, Injectable } from '@nestjs/common';
import {
  TicketClienteNoEncontradoError,
  TicketEtiquetaNoDisponibleError,
  TicketTecnicoNoValidoError,
} from '../../domain/errors/ticket-soporte.errors';
import {
  ClienteDeAviso,
  TICKET_REFERENCIA_QUERY,
  TicketReferenciaQueryPort,
} from '../../domain/ports/ticket-referencia-query.port';

export type ReferenciasNuevas = {
  clienteId?: number | null;
  usuarioIds?: number[];
  etiquetaIds?: number[];
};

@Injectable()
export class ReferenciasTicketService {
  constructor(
    @Inject(TICKET_REFERENCIA_QUERY)
    private readonly referencias: TicketReferenciaQueryPort,
  ) {}

  /**
   * Comprueba lo que se va a asignar por primera vez; lo que el ticket ya
   * tenía se conserva aunque después se haya desactivado.
   */
  async exigir(nuevas: ReferenciasNuevas): Promise<ClienteDeAviso | null> {
    let cliente: ClienteDeAviso | null = null;

    if (nuevas.clienteId) {
      cliente = await this.referencias.clienteVigente(nuevas.clienteId);
      if (!cliente) throw new TicketClienteNoEncontradoError();
    }

    const usuarios = [...new Set(nuevas.usuarioIds ?? [])];
    if (usuarios.length) {
      const activos = await this.referencias.usuariosActivos(usuarios);
      if (activos.length !== usuarios.length) {
        throw new TicketTecnicoNoValidoError();
      }
    }

    const etiquetas = [...new Set(nuevas.etiquetaIds ?? [])];
    if (etiquetas.length) {
      const vigentes = await this.referencias.etiquetasVigentes(etiquetas);
      if (vigentes.length !== etiquetas.length) {
        throw new TicketEtiquetaNoDisponibleError();
      }
    }

    return cliente;
  }
}
