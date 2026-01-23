export interface RegistrarPagoCreditoDto {
  creditoId: number;

  aplicaciones: {
    cuotaId: number;
    monto: string;
  }[];

  fechaPago?: Date;
  metodoPago?: string;
  referencia?: string;
  observacion?: string;
}

export interface RegistrarPagoCuotaDto {
  cuotaId: number;
  monto: string;

  fechaPago?: Date;
  metodoPago?: string;
  referencia?: string;
  observacion?: string;
}
export interface RegistrarPagoResponse {
  pagoCreditoId: number;
  montoTotal: string;
  fechaPago: Date;
}
