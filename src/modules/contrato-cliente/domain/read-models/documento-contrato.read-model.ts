/** Lo que se lee de la base para armar el documento de una instalación. */
export type DatosDocumentoContrato = {
  empresa: {
    id: number;
    nombre: string;
    direccion: string | null;
    telefono: string | null;
    correo: string | null;
    pbx: string | null;
    sitioWeb: string | null;
  };
  instalacion: {
    id: number;
    clienteId: number;
    servicioInternetId: number | null;
    fechaProgramada: Date | null;
    fechaActivacionServicio: Date | null;
    direccionInstalacion: string | null;
    referenciaUbicacion: string | null;
    costoInstalacion: number;
    costoMateriales: number;
    costoManoObra: number;
    costoOtros: number;
    observaciones: string | null;
    notasCostos: string | null;
    creadoEn: Date;
    actualizadoEn: Date;
  };
  cliente: {
    id: number;
    nombre: string;
    apellidos: string | null;
    dpi: string | null;
    telefono: string | null;
    direccion: string | null;
    contactoReferenciaNombre: string | null;
    contactoReferenciaTelefono: string | null;
  };
  servicio: {
    id: number;
    nombre: string;
    velocidad: string | null;
    precio: number;
  } | null;
  /** Día de pago de la zona de facturación del cliente, si tiene zona. */
  diaPagoZona: number | null;
};

export type DocumentoContratoReadModel = Omit<
  DatosDocumentoContrato,
  'cliente' | 'diaPagoZona'
> & {
  cliente: DatosDocumentoContrato['cliente'] & {
    nombreCompleto: string;
    direccionServicio: string | null;
  };
  facturacion: { diaPagoMensual: number };
  plantilla: { id: number; nombre: string };
  documento: { numero: number; fechaEmision: Date; contenido: string };
};
