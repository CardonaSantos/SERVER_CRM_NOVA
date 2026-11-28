/** Fases de la jornada diaria, en el orden en que corren (guía de cobranza §4.2). */
export enum FaseJornada {
  FACTURACION = 'FACTURACION',
  ENVIO_FACTURACION = 'ENVIO_FACTURACION',
  COBRANZA = 'COBRANZA',
  ENVIO_COBRANZA = 'ENVIO_COBRANZA',
}

export enum MomentoJornada {
  /** La corrida de las 10:00. */
  JORNADA = 'JORNADA',
  /** Cada 30 min hasta las 17:30: retoma la jornada o lo fallido. */
  REPASO = 'REPASO',
}
