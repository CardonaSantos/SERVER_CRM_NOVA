export class ZonaFacturacionResponseDto {
  /** Id de la zona */
  id: number;
  /** Nombre visible */
  nombre: string;
  /** Día de generación de facturas */
  diaGeneracionFactura: number;
  /** Día de pago */
  diaPago: number;
  /** Día del primer recordatorio */
  diaRecordatorio: number | null;
  /** Día del segundo recordatorio */
  diaSegundoRecordatorio: number | null;
  /** Día de corte */
  diaCorte: number | null;
  /** Facturas vencidas para suspender */
  suspenderTrasFacturas: number | null;
  /** Interruptor general de avisos */
  enviarRecordatorio: boolean;
  /** Aviso al generar la factura */
  enviarRecordatorioGeneracion: boolean;
  /** Aviso el día de pago */
  enviarAvisoPago: boolean;
  /** Primer recordatorio */
  enviarRecordatorio1: boolean;
  /** Segundo recordatorio */
  enviarRecordatorio2: boolean;
  /** Fecha de creación (ISO 8601) */
  creadoEn: string;
  /** Última actualización (ISO 8601) */
  actualizadoEn: string;
}

export class ZonaFacturacionListadoResponseDto extends ZonaFacturacionResponseDto {
  /** Clientes no eliminados de la zona */
  clientesCount: number;
  /** Facturas de la zona */
  facturasCount: number;
}

export class ZonaFacturacionOpcionResponseDto {
  /** Id de la zona */
  id: number;
  /** Nombre visible */
  nombre: string;
  /** Clientes no eliminados de la zona */
  clientesCount: number;
  /** Facturas de la zona */
  facturasCount: number;
}

export class ZonaFacturacionEliminadaResponseDto {
  /** Id de la zona */
  zonaId: number;
  /** Momento del borrado lógico (ISO 8601) */
  eliminadoEn: string;
}
