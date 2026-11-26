import { ClienteInstalacionResumen } from './cliente-instalacion-resumen.read-model';

export type InstalacionTecnicaParticipante = {
  asignacionId: number;

  tecnicoId: number | null;

  nombre: string;

  avatarUrl: string | null;

  rol: string;

  esResponsable: boolean;

  tiempoMinutos: number | null;

  observaciones: string | null;
};

export type InstalacionTecnicaEvidencia = {
  evidenciaId: number;

  mediaId: number;

  tipo: string;

  descripcion: string | null;

  orden: number;

  url: string | null;

  mimeType: string | null;

  titulo: string | null;

  creadoEn: Date;
};

export type InstalacionTecnicaEquipo = {
  id: number;

  productoId: number | null;

  productoNombre: string | null;

  serialProductoId: number | null;

  serial: string | null;

  descripcion: string | null;

  cantidad: number;

  esPrincipal: boolean;

  notas: string | null;
};

export type InstalacionTecnicaConfiguracion = {
  id: number;

  potenciaOpticaRxDbm: number | null;

  senalInalambricaDbm: number | null;

  ssid: string | null;

  /**
   * No devuelve contrasenaWifiProtegida.
   */
  tieneContrasenaWifi: boolean;

  bandaWifi: string | null;

  canal: number | null;

  anchoCanalMhz: number | null;

  ipv4: string | null;

  ipv6: string | null;

  gateway: string | null;

  dnsPrimario: string | null;

  dnsSecundario: string | null;

  observaciones: string | null;
};

export type InstalacionTecnicaCuentaPppoe = {
  id: number;

  usuario: string;

  estado: string;

  perfilHomologacionId: number;

  codigoPerfil: string;

  mikrotikRouterId: number;

  routerNombre: string;

  generadoEn: Date;

  activadoEn: Date | null;

  ultimaSincronizacionEn: Date | null;

  ultimoError: string | null;
};

export type InstalacionTecnicaAcceso = {
  vinculoId: number;

  accion: string;

  accesoInternetId: number;

  tecnologia: string;

  metodoAutenticacion: string;

  estado: string;

  servicioInternetId: number | null;

  configuracionTecnica: InstalacionTecnicaConfiguracion | null;

  cuentaPppoe: InstalacionTecnicaCuentaPppoe | null;
};

export type InstalacionTecnicaMiAsignacion = {
  asignacionId: number;

  tecnicoId: number | null;

  rol: string;

  esResponsable: boolean;
};

export type ClienteInstalacionTechnicalDetail = {
  instalacion: ClienteInstalacionResumen;

  cliente: {
    id: number;

    nombre: string;

    apellidos: string | null;

    telefono: string | null;

    telefonoReferencia: string | null;

    dpi: string | null;

    direccion: string | null;

    observaciones: string | null;

    municipio: string | null;
    departamento: string | null;

    sector: string | null;
  };

  servicioInternet: {
    id: number;

    nombre: string;

    velocidad: string | null;

    precio: number | null;
  } | null;

  /**
   * Es solo contexto visual.
   * No concede ni limita permisos.
   */
  miAsignacion: InstalacionTecnicaMiAsignacion | null;

  participantes: InstalacionTecnicaParticipante[];

  accesos: InstalacionTecnicaAcceso[];

  evidencias: InstalacionTecnicaEvidencia[];

  equipos: InstalacionTecnicaEquipo[];
};

export type InstalacionTecnicaAccion = {
  habilitada: boolean;

  motivo: string | null;
};

export type InstalacionTecnicaAcciones = {
  reprogramar: InstalacionTecnicaAccion;

  iniciar: InstalacionTecnicaAccion;

  completar: InstalacionTecnicaAccion;

  cancelar: InstalacionTecnicaAccion;

  subirEvidencia: InstalacionTecnicaAccion;

  revelarCredenciales: InstalacionTecnicaAccion;

  reintentarPrealta: InstalacionTecnicaAccion;
};

export type ClienteInstalacionTechnicalResult =
  ClienteInstalacionTechnicalDetail & {
    acciones: InstalacionTecnicaAcciones;
  };
