import { AccionTicket } from '../enums/accion-ticket.enum';
import { FaseTicket } from '../enums/fase-ticket.enum';
import {
  TicketAccionDeOficinaError,
  TicketAccionNoPermitidaError,
  TicketNoAsignadoError,
} from '../errors/ticket-soporte.errors';
import { NOMBRE_FASE } from './fase-ticket.policy';

const { ABIERTA, EN_PROCESO, EN_REVISION, RESUELTA, CANCELADA } = FaseTicket;

/** La oficina puede mover un ticket desde cualquiera de estas fases. */
const DESDE_OFICINA: Record<AccionTicket, FaseTicket[]> = {
  [AccionTicket.INICIAR]: [ABIERTA, EN_REVISION],
  [AccionTicket.ENVIAR_REVISION]: [ABIERTA, EN_PROCESO],
  [AccionTicket.DEVOLVER]: [EN_PROCESO, EN_REVISION],
  [AccionTicket.RESOLVER]: [ABIERTA, EN_PROCESO, EN_REVISION],
  [AccionTicket.CANCELAR]: [ABIERTA, EN_PROCESO, EN_REVISION],
  [AccionTicket.REABRIR]: [RESUELTA, CANCELADA],
};

/** El técnico solo inicia y entrega a revisión los tickets que tiene asignados. */
const DESDE_TECNICO: Partial<Record<AccionTicket, FaseTicket[]>> = {
  [AccionTicket.INICIAR]: [ABIERTA],
  [AccionTicket.ENVIAR_REVISION]: [EN_PROCESO],
};

export type QuienActua = {
  /** Personal de oficina: puede cambiar cualquier ticket. */
  gestiona: boolean;
  asignado: boolean;
};

export function exigirAccion(
  accion: AccionTicket,
  fase: FaseTicket,
  quien: QuienActua,
): void {
  if (!quien.gestiona) {
    if (!DESDE_TECNICO[accion]) throw new TicketAccionDeOficinaError();
    if (!quien.asignado) throw new TicketNoAsignadoError();
  }

  const desde = quien.gestiona ? DESDE_OFICINA : DESDE_TECNICO;

  if (!desde[accion]?.includes(fase)) {
    throw new TicketAccionNoPermitidaError(
      `El ticket está en estado "${NOMBRE_FASE[fase]}" y no admite este cambio.`,
    );
  }
}

/** Botones que la UI puede mostrar a este usuario para este ticket. */
export function accionesDisponibles(
  fase: FaseTicket,
  quien: QuienActua & { tieneAsignados: boolean },
): AccionTicket[] {
  const desde = quien.gestiona
    ? DESDE_OFICINA
    : quien.asignado
      ? DESDE_TECNICO
      : {};

  return Object.values(AccionTicket).filter(
    (accion) =>
      !!desde[accion]?.includes(fase) &&
      (accion !== AccionTicket.INICIAR || quien.tieneAsignados),
  );
}
