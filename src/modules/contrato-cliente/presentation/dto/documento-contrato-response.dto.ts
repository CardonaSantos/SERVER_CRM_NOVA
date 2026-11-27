export class DocumentoContratoResponseDto {
  /** Datos de la empresa para el encabezado */
  empresa: {
    id: number;
    nombre: string;
    direccion: string | null;
    telefono: string | null;
    correo: string | null;
    pbx: string | null;
    sitioWeb: string | null;
  };
  /** Instalación del documento */
  instalacion: {
    id: number;
    clienteId: number;
    servicioInternetId: number | null;
    fechaProgramada: string | null;
    direccionInstalacion: string | null;
    referenciaUbicacion: string | null;
    costoInstalacion: number;
    costoMateriales: number;
    costoManoObra: number;
    costoOtros: number;
    observaciones: string | null;
    notasCostos: string | null;
    creadoEn: string;
    actualizadoEn: string;
  };
  /** Cliente que firma */
  cliente: {
    id: number;
    nombre: string;
    apellidos: string | null;
    nombreCompleto: string;
    dpi: string | null;
    telefono: string | null;
    direccion: string | null;
    direccionServicio: string | null;
    contactoReferenciaNombre: string | null;
    contactoReferenciaTelefono: string | null;
  };
  /** Plan instalado */
  servicio: {
    id: number;
    nombre: string;
    velocidad: string | null;
    precio: number;
  } | null;
  /** Día de pago de la zona del cliente */
  facturacion: { diaPagoMensual: number };
  /** Plantilla usada */
  plantilla: { id: number; nombre: string };
  /** Documento ya relleno */
  documento: { numero: number; fechaEmision: string; contenido: string };
}
