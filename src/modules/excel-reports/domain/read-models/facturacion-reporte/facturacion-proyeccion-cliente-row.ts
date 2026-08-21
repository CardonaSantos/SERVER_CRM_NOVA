export interface FacturacionProyeccionClienteRow {
  clienteId: number;

  clienteNombre: string;

  servicioInternetId: number;

  servicioInternetNombre: string;

  precioMensual: number;

  facturacionZonaId: number;

  facturacionZonaNombre: string;

  diaGeneracionFactura: number;

  diaPago: number;
}
