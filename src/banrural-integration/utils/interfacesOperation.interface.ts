// src/banrural-integration/interfaces/iniciar-pago-response.interface.ts
export interface SuccessResponsePago {
  facturaId: number;
  confirmacionBanco?: string;
  saldoFacturaRestante?: number;
  saldoTotalPendiente?: number;
}

export class IniciarPagoResponse {
  success: 1 | 0;
  status: number;
  data?: SuccessResponsePago;
  error?: string;
}
