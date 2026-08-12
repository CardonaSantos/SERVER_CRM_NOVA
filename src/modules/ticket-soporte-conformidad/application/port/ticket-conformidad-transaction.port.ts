import { TicketConformidadEnlaceEntity } from '../../domain/entities/ticket-conformidad-enlace.entity';
import { TicketConformidadEntity } from '../../domain/entities/ticket-conformidad.entity';
import { TicketFirmaEntity } from '../../domain/entities/ticket-firma.entity';

export const TICKET_CONFORMIDAD_TRANSACTION_PORT = Symbol(
  'TICKET_CONFORMIDAD_TRANSACTION_PORT',
);

/* =========================================================
 * RETRABAJO
 * ======================================================= */

export interface PersistirRetrabajoTicketConformidadInput {
  conformidad: TicketConformidadEntity;

  enlace: TicketConformidadEnlaceEntity;

  fechaOperacion: Date;
}

export interface PersistirRetrabajoTicketConformidadOutput {
  conformidad: TicketConformidadEntity;

  enlace: TicketConformidadEnlaceEntity;
}

/* =========================================================
 * FIRMA CLIENTE
 * ======================================================= */

export interface PersistirFirmaClienteTicketConformidadInput {
  conformidad: TicketConformidadEntity;

  enlace: TicketConformidadEnlaceEntity;

  firma: TicketFirmaEntity;

  fechaOperacion: Date;
}

export interface PersistirFirmaClienteTicketConformidadOutput {
  conformidad: TicketConformidadEntity;

  enlace: TicketConformidadEnlaceEntity;

  firma: TicketFirmaEntity;
}

/* =========================================================
 * PORT
 * ======================================================= */

export interface TicketConformidadTransactionPort {
  persistirRetrabajo(
    input: PersistirRetrabajoTicketConformidadInput,
  ): Promise<PersistirRetrabajoTicketConformidadOutput>;

  persistirFirmaCliente(
    input: PersistirFirmaClienteTicketConformidadInput,
  ): Promise<PersistirFirmaClienteTicketConformidadOutput>;
}
