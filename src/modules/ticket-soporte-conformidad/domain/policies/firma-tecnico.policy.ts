import { TicketConformidadEntity } from '../entities/ticket-conformidad.entity';
import {
  TicketConformidadContextoIncompletoError,
  TicketConformidadEstadoInvalidoError,
  TicketConformidadProhibidaError,
} from '../errors/ticket-soporte-conformidad.errors';

/**
 * Quién y cuándo puede firmar como técnico: la conformidad no pidió retrabajo
 * (puede estar PENDIENTE o CONFORME, así técnico y cliente firman en cualquier
 * orden), tiene técnico asignado y ese técnico es quien firma. Devuelve el
 * cliente del ciclo, que la firma necesita para guardar el archivo.
 */
export function exigirFirmaTecnicaPermitida(
  conformidad: TicketConformidadEntity,
  usuarioFirmanteId: number,
): { clienteId: number } {
  if (conformidad.requiereRetrabajo()) {
    throw new TicketConformidadEstadoInvalidoError(
      'No puede registrarse la firma técnica en una conformidad que requiere retrabajo.',
    );
  }

  if (conformidad.tecnicoAsignadoId === null) {
    throw new TicketConformidadContextoIncompletoError(
      'La conformidad no posee un técnico asignado.',
    );
  }

  if (conformidad.tecnicoAsignadoId !== usuarioFirmanteId) {
    throw new TicketConformidadProhibidaError();
  }

  if (conformidad.clienteId === null) {
    throw new TicketConformidadContextoIncompletoError(
      'La conformidad no tiene un cliente asociado.',
    );
  }

  return { clienteId: conformidad.clienteId };
}
