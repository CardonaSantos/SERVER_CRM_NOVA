import { BandejaTicket } from '../enums/bandeja-ticket.enum';
import { EstadoTicket } from '../enums/estado-ticket.enum';
import { FaseTicket } from '../enums/fase-ticket.enum';

const FASE_DE_ESTADO: Record<EstadoTicket, FaseTicket> = {
  [EstadoTicket.NUEVO]: FaseTicket.ABIERTA,
  [EstadoTicket.ABIERTA]: FaseTicket.ABIERTA,
  // Estados antiguos de espera: ya no se asignan, se muestran como abiertos.
  [EstadoTicket.PENDIENTE]: FaseTicket.ABIERTA,
  [EstadoTicket.PENDIENTE_CLIENTE]: FaseTicket.ABIERTA,
  [EstadoTicket.PENDIENTE_TECNICO]: FaseTicket.ABIERTA,
  [EstadoTicket.EN_PROCESO]: FaseTicket.EN_PROCESO,
  [EstadoTicket.PENDIENTE_REVISION]: FaseTicket.EN_REVISION,
  [EstadoTicket.RESUELTA]: FaseTicket.RESUELTA,
  [EstadoTicket.CERRADO]: FaseTicket.RESUELTA,
  [EstadoTicket.ARCHIVADA]: FaseTicket.RESUELTA,
  [EstadoTicket.CANCELADA]: FaseTicket.CANCELADA,
};

export const NOMBRE_FASE: Record<FaseTicket, string> = {
  [FaseTicket.ABIERTA]: 'Abierta',
  [FaseTicket.EN_PROCESO]: 'En proceso',
  [FaseTicket.EN_REVISION]: 'En revisión',
  [FaseTicket.RESUELTA]: 'Resuelta',
  [FaseTicket.CANCELADA]: 'Cancelada',
};

const FASES_DE_BANDEJA: Record<BandejaTicket, FaseTicket[]> = {
  [BandejaTicket.ACTIVOS]: [
    FaseTicket.ABIERTA,
    FaseTicket.EN_PROCESO,
    FaseTicket.EN_REVISION,
  ],
  [BandejaTicket.ABIERTOS]: [FaseTicket.ABIERTA],
  [BandejaTicket.EN_PROCESO]: [FaseTicket.EN_PROCESO],
  [BandejaTicket.EN_REVISION]: [FaseTicket.EN_REVISION],
  [BandejaTicket.RESUELTOS]: [FaseTicket.RESUELTA],
  [BandejaTicket.CANCELADOS]: [FaseTicket.CANCELADA],
  [BandejaTicket.TODOS]: Object.values(FaseTicket),
};

export type ContadoresBandeja = {
  activos: number;
  abiertos: number;
  enProceso: number;
  enRevision: number;
  resueltos: number;
  cancelados: number;
  todos: number;
};

export function faseDe(estado: EstadoTicket): FaseTicket {
  return FASE_DE_ESTADO[estado];
}

/** Estados guardados que caen en una bandeja. */
export function estadosDeBandeja(bandeja: BandejaTicket): EstadoTicket[] {
  const fases = FASES_DE_BANDEJA[bandeja];

  return Object.values(EstadoTicket).filter((estado) =>
    fases.includes(faseDe(estado)),
  );
}

/** Suma los totales por estado en las bandejas que ve la UI. */
export function contarBandejas(
  porEstado: Array<{ estado: EstadoTicket; total: number }>,
): ContadoresBandeja {
  const sumar = (bandeja: BandejaTicket) => {
    const estados = estadosDeBandeja(bandeja);

    return porEstado
      .filter((fila) => estados.includes(fila.estado))
      .reduce((total, fila) => total + fila.total, 0);
  };

  return {
    activos: sumar(BandejaTicket.ACTIVOS),
    abiertos: sumar(BandejaTicket.ABIERTOS),
    enProceso: sumar(BandejaTicket.EN_PROCESO),
    enRevision: sumar(BandejaTicket.EN_REVISION),
    resueltos: sumar(BandejaTicket.RESUELTOS),
    cancelados: sumar(BandejaTicket.CANCELADOS),
    todos: sumar(BandejaTicket.TODOS),
  };
}
