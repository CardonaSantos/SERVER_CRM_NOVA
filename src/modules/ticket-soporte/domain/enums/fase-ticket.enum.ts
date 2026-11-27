/** El estado que ve la UI y sobre el que se decide qué se puede hacer. */
export enum FaseTicket {
  ABIERTA = 'ABIERTA',
  EN_PROCESO = 'EN_PROCESO',
  EN_REVISION = 'EN_REVISION',
  RESUELTA = 'RESUELTA',
  CANCELADA = 'CANCELADA',
}
