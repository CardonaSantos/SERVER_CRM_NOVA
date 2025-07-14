export interface ClienteGetInfo {
  id: number;
  nombre: string;
  dpi: string;
  telefono: string;
  direccion: string;
}

export class ClienteInfoResponse {
  success: 1 | 0;
  status: number;
  data?: ClienteGetInfo;
  error?: string;
}

//INTERFACE PARA EL GET DE FACTURAS
export interface FacturasCliente {
  id: number;
  monto: number;
  fechaPago: Date | string;
  periodo: string;
  detalleFactura: string;
}

export class FacturasResponse {
  success: 1 | 0;
  status: number;
  data?: FacturasCliente[];
  error?: string;
}

export interface FacturaPendiente {
  facturaId: number;
  monto: number;
  fechaPagoEsperada: string;
  detalleFactura: string;
  periodo: string;
}

export interface ConsultaResponse {
  success: 1 | 0;
  status: number;
  data: FacturaPendiente[];
}
