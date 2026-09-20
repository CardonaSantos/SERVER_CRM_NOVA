export interface ContratoInstalacionVistaResponse {
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
    nombreCompleto: string;

    dpi: string | null;
    telefono: string | null;

    direccion: string | null;
    direccionServicio: string | null;

    contactoReferenciaNombre: string | null;
    contactoReferenciaTelefono: string | null;
  };

  servicio: {
    id: number;
    nombre: string;
    velocidad: string | null;
    precio: number;
  } | null;

  facturacion: {
    diaPagoMensual: number | null;
  };

  plantilla: {
    id: number;
    nombre: string;
  };

  documento: {
    numero: number;
    fechaEmision: Date;
    contenido: string;
  };
}
