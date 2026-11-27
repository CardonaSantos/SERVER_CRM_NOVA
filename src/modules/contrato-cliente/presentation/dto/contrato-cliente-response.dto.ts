export class ContratoClienteResponseDto {
  /** Id del contrato */
  id: number;
  /** Cliente */
  clienteId: number;
  /** Fecha programada de instalación (`YYYY-MM-DD`) */
  fechaInstalacionProgramada: string | null;
  /** Fecha de pago (`YYYY-MM-DD`) */
  fechaPago: string | null;
  /** Costo de instalación */
  costoInstalacion: number | null;
  /** Observaciones */
  observaciones: string | null;
  /** Alta */
  creadoEn: string;
}
