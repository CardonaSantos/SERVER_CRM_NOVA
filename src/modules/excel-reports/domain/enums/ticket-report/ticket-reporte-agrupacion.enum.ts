export const TicketReporteAgrupacion = {
  AUTO: 'AUTO',
  DIA: 'DIA',
  SEMANA: 'SEMANA',
  MES: 'MES',
} as const;

export type TicketReporteAgrupacion =
  (typeof TicketReporteAgrupacion)[keyof typeof TicketReporteAgrupacion];

export type TicketReporteAgrupacionEfectiva = Exclude<
  TicketReporteAgrupacion,
  typeof TicketReporteAgrupacion.AUTO
>;
