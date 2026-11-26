import { SaldoCliente } from '../policies/saldo.policy';
import { NombradoReadModel } from './cliente-listado.read-model';

export type ImagenClienteReadModel = {
  id: number;
  categoria: string | null;
  cdnUrl: string | null;
  descripcion: string | null;
  estado: string | null;
  etiqueta: string | null;
  titulo: string | null;
};

type PersonaReadModel = { id: number; nombre: string; rol: string };

export type SeguimientoClienteReadModel = {
  id: number;
  descripcion: string;
  creadoEn: Date;
  usuario: {
    id: number;
    nombre: string;
    rol: string;
    avatarUrl: string | null;
    portadaUrl: string | null;
    bio: string | null;
  } | null;
};

export type TicketClienteReadModel = {
  id: number;
  titulo: string | null;
  descripcion: string | null;
  estado: string;
  prioridad: string;
  fechaApertura: Date;
  fechaCierre: Date | null;
  fechaInicioAtencion: Date | null;
  fechaResolucionTecnico: Date | null;
  resumen: {
    id: number;
    tiempoTecnicoMinutos: number | null;
    tiempoTotalMinutos: number | null;
    resueltoComo: string | null;
    reabierto: boolean;
    numeroReaperturas: number;
    notasInternas: string | null;
    creadoEn: Date;
  } | null;
  etiquetas: NombradoReadModel[];
  seguimientos: SeguimientoClienteReadModel[];
  creadoPor: NombradoReadModel | null;
  tecnico: NombradoReadModel | null;
  acompanantes: NombradoReadModel[];
};

export type FacturaClienteReadModel = {
  id: number;
  monto: number;
  estado: string;
  periodo: string | null;
  fechaEmision: Date;
  fechaPagada: Date | null;
  fechaVencimiento: Date | null;
  creador: PersonaReadModel | null;
  pagos: {
    fechaPago: Date;
    metodoPago: string;
    montoPagado: number;
    cobrador: PersonaReadModel | null;
  }[];
};

/** La ficha completa de un cliente. */
export type ClienteDetalleReadModel = {
  id: number;
  nombre: string;
  apellidos: string | null;
  telefono: string | null;
  direccion: string | null;
  dpi: string | null;
  observaciones: string | null;
  contactoReferenciaNombre: string | null;
  contactoReferenciaTelefono: string | null;
  estadoCliente: string;
  estadoCobranza: string;
  estadoServicioMikrotik: string;
  contrasenaWifi: string | null;
  ssidRouter: string | null;
  fechaInstalacion: Date | null;
  creadoEn: Date;
  actualizadoEn: Date;
  eliminadoEn: Date | null;
  imagenes: ImagenClienteReadModel[];
  asesor: NombradoReadModel | null;
  servicio: {
    id: number;
    nombre: string;
    precio: number;
    velocidad: string | null;
  } | null;
  municipio: NombradoReadModel | null;
  departamento: NombradoReadModel | null;
  sector: NombradoReadModel | null;
  empresa: NombradoReadModel | null;
  mikrotik: NombradoReadModel | null;
  ip: {
    id: number;
    direccion: string | null;
    mascara: string | null;
    gateway: string | null;
  } | null;
  ubicacion: {
    id: number;
    latitud: number | null;
    longitud: number | null;
  } | null;
  facturacionZona: {
    id: number;
    nombre: string;
    creadoEn: Date;
    actualizadoEn: Date;
    enviarRecordatorio: boolean;
    diaPago: number | null;
    diaGeneracionFactura: number | null;
    diaCorte: number | null;
  } | null;
  contratoServicioInternet: {
    id: number;
    creadoEn: Date;
    actualizadoEn: Date;
    costoInstalacion: number | null;
    fechaInstalacionProgramada: Date | null;
    fechaPago: Date | null;
  } | null;
  saldo: SaldoCliente;
  tickets: TicketClienteReadModel[];
  facturas: FacturaClienteReadModel[];
  serviciosAdicionales: {
    id: number;
    servicio: {
      id: number;
      nombre: string;
      tipo: string | null;
      precio: number;
    };
    fechaContratacion: Date | null;
  }[];
};

/** Lo que necesita el formulario de edición. */
export type ClienteEdicionReadModel = {
  id: number;
  eliminado: boolean;
  nombre: string;
  apellidos: string | null;
  telefono: string | null;
  direccion: string | null;
  dpi: string | null;
  observaciones: string | null;
  contactoReferenciaNombre: string | null;
  contactoReferenciaTelefono: string | null;
  enviarRecordatorio: boolean;
  estadoCliente: string;
  estadoCobranza: string;
  contrasenaWifi: string | null;
  ssidRouter: string | null;
  fechaInstalacion: Date | null;
  coordenadas: { latitud: number; longitud: number } | null;
  ip: {
    direccionIp: string | null;
    gateway: string | null;
    mascara: string | null;
  } | null;
  departamento: NombradoReadModel | null;
  municipio: NombradoReadModel | null;
  sector: NombradoReadModel | null;
  zonaFacturacion: NombradoReadModel | null;
  mikrotik: NombradoReadModel | null;
  servicioInternet: {
    id: number;
    nombre: string;
    velocidad: string | null;
  } | null;
  servicios: NombradoReadModel[];
  imagenes: ImagenClienteReadModel[];
  contrato: {
    idContrato: string;
    fechaFirma: Date | null;
    archivoContrato: string | null;
    observaciones: string | null;
  } | null;
};
