/** Lo que se configura de una zona. */
export type ZonaFacturacionConfiguracion = {
  nombre: string;
  diaGeneracionFactura: number;
  diaPago: number;
  /** `null` solo en registros anteriores; al configurar se exige un día. */
  diaRecordatorio: number | null;
  diaSegundoRecordatorio: number | null;
  /** Aún no lo usa ningún proceso: queda para la cobranza. */
  diaCorte: number | null;
  /** Aún no lo usa ningún proceso: queda para la cobranza. */
  suspenderTrasFacturas: number | null;
  /** Interruptor general de avisos de la zona. */
  enviarRecordatorio: boolean;
  enviarRecordatorioGeneracion: boolean;
  enviarAvisoPago: boolean;
  enviarRecordatorio1: boolean;
  enviarRecordatorio2: boolean;
};

export type ZonaFacturacionProps = ZonaFacturacionConfiguracion & {
  id: number | null;
  empresaId: number;
  creadoEn: Date;
  actualizadoEn: Date;
  eliminadoEn: Date | null;
  eliminadoPorId: number | null;
};

export type CrearZonaFacturacionProps = {
  empresaId: number;
  nombre: string;
  diaGeneracionFactura: number;
  diaPago: number;
  diaRecordatorio: number;
  diaSegundoRecordatorio: number;
  diaCorte?: number | null;
  suspenderTrasFacturas?: number | null;
  enviarRecordatorio: boolean;
  enviarRecordatorioGeneracion: boolean;
  enviarAvisoPago: boolean;
  enviarRecordatorio1: boolean;
  enviarRecordatorio2: boolean;
};

/** Lo que no llega no cambia; `null` borra el día de corte o la suspensión. */
export type ConfigurarZonaFacturacionProps = Partial<
  Omit<CrearZonaFacturacionProps, 'empresaId'>
>;
