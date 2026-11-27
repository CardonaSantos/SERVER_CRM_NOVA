/** Estado tal como se guarda en la base. Los flujos actuales usan cinco fases (ver `FaseTicket`). */
export enum EstadoTicket {
  NUEVO = 'NUEVO',
  ABIERTA = 'ABIERTA',
  EN_PROCESO = 'EN_PROCESO',
  PENDIENTE = 'PENDIENTE',
  PENDIENTE_CLIENTE = 'PENDIENTE_CLIENTE',
  PENDIENTE_TECNICO = 'PENDIENTE_TECNICO',
  PENDIENTE_REVISION = 'PENDIENTE_REVISION',
  RESUELTA = 'RESUELTA',
  CERRADO = 'CERRADO',
  ARCHIVADA = 'ARCHIVADA',
  CANCELADA = 'CANCELADA',
}
