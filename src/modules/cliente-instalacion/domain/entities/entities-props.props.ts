import { Money } from 'src/shared/domain/value-objects/money.vo';
import { EstadoInstalacionCliente } from '../enums/estado-instalacion-cliente.enum';
import { TipoInstalacionCliente } from '../enums/tipo-instalacion-cliente.enum';
import { TipoEvidenciaClienteOperacion } from '../enums/tipo-evidencia-cliente-operacion.enum';
import { RolTecnicoOperacionCliente } from '../enums/rol-tecnico-operacion-cliente.enum';

// CREACION E INSTANCIA
export type ClienteInstalacionProps = {
  id?: number;

  empresaId: number;
  clienteId: number;

  servicioInternetId?: number | null;
  ticketId?: number | null;

  asesorId?: number | null;
  creadoPorId?: number | null;
  completadoPorId?: number | null;
  descripcion?: string | null;

  tipo: TipoInstalacionCliente;
  estado: EstadoInstalacionCliente;

  fechaProgramada?: Date | null;
  fechaInicio?: Date | null;
  fechaFinalizacion?: Date | null;
  fechaCancelacion?: Date | null;
  fechaActivacionServicio?: Date | null;

  motivo?: string | null;
  observaciones?: string | null;
  resultado?: string | null;

  direccionInstalacion?: string | null;
  referenciaUbicacion?: string | null;
  latitud?: number | null;
  longitud?: number | null;

  ssidRouter?: string | null;
  contrasenaWifi?: string | null;

  costoInstalacion: Money;
  costoMateriales: Money;
  costoManoObra: Money;
  costoOtros: Money;
  montoCobradoCliente: Money;
  saldoPendiente: Money;

  notasCostos?: string | null;

  esMigrada: boolean;
  metadata?: unknown;

  creadoEn?: Date;
  actualizadoEn?: Date;
};

export type CrearClienteInstalacionCostosProps = {
  costoInstalacion?: number;
  costoMateriales?: number;
  costoManoObra?: number;
  costoOtros?: number;

  montoCobradoCliente?: number;
  saldoPendiente?: number;

  notas?: string | null;
};

export type CrearClienteInstalacionProps = {
  empresaId: number;
  clienteId: number;

  servicioInternetId?: number | null;
  ticketId?: number | null;

  asesorId?: number | null;
  creadoPorId: number;

  tipo?: TipoInstalacionCliente;
  estado?: EstadoInstalacionCliente;

  descripcion?: string | null;
  motivo?: string | null;
  observaciones?: string | null;

  fechaProgramada?: Date | null;
  fechaInicio?: Date | null;

  direccionInstalacion?: string | null;
  referenciaUbicacion?: string | null;

  latitud?: number | null;
  longitud?: number | null;

  costos?: CrearClienteInstalacionCostosProps;
};

export type ClienteInstalacionMedia = {
  id?: number;

  instalacionId?: number | null;
  mediaId: number;
  tipo: TipoEvidenciaClienteOperacion;
  descripcion?: string;
  orden: number;
  creadoEn?: Date;
  actualizadoEn?: Date;
};

// RETORNOS Y VALIDACIONES
export type ReprogramarClienteInstalacionParams = {
  fechaProgramada: Date;
  motivo?: string | null;
};

export type IniciarClienteInstalacionParams = {
  fechaInicio?: Date;
};

export type CompletarClienteInstalacionParams = {
  completadoPorId: number;
  resultado?: string | null;
  observaciones?: string | null;
  fechaFinalizacion?: Date;
  activarServicio?: boolean;
};

export type CancelarClienteInstalacionParams = {
  motivo: string;
  observaciones?: string | null;
  fechaCancelacion?: Date;
};

export type MarcarFallidaClienteInstalacionParams = {
  motivo: string;
  resultado?: string | null;
  observaciones?: string | null;
  fechaFinalizacion?: Date;
};

export type ActualizarDatosGeneralesInstalacionParams = {
  asesorId?: number | null;
  servicioInternetId?: number | null;
  ticketId?: number | null;
  fechaProgramada?: Date | null;
  direccionInstalacion?: string | null;
  referenciaUbicacion?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  observaciones?: string | null;
};

export type ActualizarCostosInstalacionParams = {
  costoInstalacion?: Money;
  costoMateriales?: Money;
  costoManoObra?: Money;
  costoOtros?: Money;
  montoCobradoCliente?: Money;
  notasCostos?: string | null;
};

export type RegistrarConfiguracionWifiParams = {
  ssidRouter: string;
  contrasenaWifi: string;
};

// NUEVAS PROSP

export type ClienteInstalacionTecnicoProps = {
  id?: number;

  instalacionId: number;
  tecnicoId?: number | null;

  rol: RolTecnicoOperacionCliente;

  esResponsable: boolean;
  tiempoMinutos?: number | null;
  observaciones?: string | null;

  tecnicoNombreSnapshot?: string | null;

  creadoEn?: Date;
  actualizadoEn?: Date;
};

export type CrearClienteInstalacionTecnicoProps = {
  instalacionId: number;
  tecnicoId: number;

  rol?: RolTecnicoOperacionCliente;
  esResponsable?: boolean;

  observaciones?: string | null;
  tecnicoNombreSnapshot?: string | null;
};
