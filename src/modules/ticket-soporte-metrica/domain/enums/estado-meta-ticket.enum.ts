/** Salvo `CANCELADA`, el estado no se guarda: sale de las fechas y del avance. */
export enum EstadoMetaTicket {
  PROGRAMADA = 'PROGRAMADA',
  EN_CURSO = 'EN_CURSO',
  CUMPLIDA = 'CUMPLIDA',
  NO_CUMPLIDA = 'NO_CUMPLIDA',
  CANCELADA = 'CANCELADA',
}
