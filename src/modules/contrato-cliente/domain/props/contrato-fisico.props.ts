/** El contrato en papel firmado por el cliente (uno por cliente). */
export type ContratoFisicoProps = {
  clienteId: number;
  /** Número del contrato; no se repite entre clientes. */
  idContrato: string;
  fechaFirma?: Date;
  archivoContrato?: string;
  observaciones?: string;
};
