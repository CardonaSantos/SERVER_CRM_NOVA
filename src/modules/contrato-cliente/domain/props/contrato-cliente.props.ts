export type ContratoClienteProps = {
  id: number | null;
  clienteId: number;
  /** Fecha de negocio `YYYY-MM-DD`. */
  fechaInstalacionProgramada: string | null;
  /** Fecha de negocio `YYYY-MM-DD`. */
  fechaPago: string | null;
  costoInstalacion: number | null;
  observaciones: string | null;
  creadoEn: Date;
  actualizadoEn: Date;
};

export type CrearContratoClienteProps = {
  clienteId: number;
  fechaInstalacionProgramada?: string | null;
  fechaPago?: string | null;
  costoInstalacion?: number | null;
  observaciones?: string | null;
};
