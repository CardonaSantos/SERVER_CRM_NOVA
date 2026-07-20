import { Money } from 'src/shared/domain/value-objects/money.vo';
import { EstadoDesinstalacionCliente } from '../enums/estado-desinstalacion-cliente.enum';
import { MotivoDesinstalacionCliente } from '../enums/motivo-desinstalacion-cliente.enum';
import { TipoDesinstalacionCliente } from '../enums/tipo-desinstalacion-cliente.enum';

export type ClienteDesinstalacionProps = {
  id?: number;

  empresaId: number;
  clienteId: number;

  servicioInternetId?: number | null;
  ticketId?: number | null;

  solicitadoPorId?: number | null;
  ejecutadoPorId?: number | null;
  creadoPorId?: number | null;

  tipo: TipoDesinstalacionCliente;
  motivo?: MotivoDesinstalacionCliente | null;
  estado: EstadoDesinstalacionCliente;

  fechaSolicitud?: Date | null;
  fechaProgramada?: Date | null;
  fechaInicio?: Date | null;
  fechaFinalizacion?: Date | null;
  fechaCancelacion?: Date | null;

  requiereRetiroEquipo: boolean;
  equipoRecuperado: boolean;

  saldoClienteAlMomento: Money;
  costoDesinstalacion: Money;
  costoTransporte: Money;
  costoManoObra: Money;
  costoOtros: Money;

  direccionServicio?: string | null;
  referenciaUbicacion?: string | null;
  latitud?: number | null;
  longitud?: number | null;

  firmadoPor?: string | null;
  dpiFirmante?: string | null;
  conforme?: boolean | null;

  observaciones?: string | null;
  resultado?: string | null;
  metadata?: unknown;

  creadoEn?: Date;
  actualizadoEn?: Date;
};

// CREAR REGISTRO
export type CrearClienteDesinstalacionProps = {
  empresaId: number;
  clienteId: number;

  servicioInternetId?: number | null;
  ticketId?: number | null;

  solicitadoPorId?: number | null;
  ejecutadoPorId?: number | null;
  creadoPorId?: number | null;

  tipo?: TipoDesinstalacionCliente;
  motivo?: MotivoDesinstalacionCliente | null;

  fechaSolicitud?: Date | null;
  fechaProgramada?: Date | null;

  requiereRetiroEquipo?: boolean;

  saldoClienteAlMomento?: Money;

  direccionServicio?: string | null;
  referenciaUbicacion?: string | null;
  latitud?: number | null;
  longitud?: number | null;

  observaciones?: string | null;
  metadata?: unknown;
};

// ACTUALIZAR POR MEDIO DE COMPORTAMIENTO DE ENTIDAD
export type ActualizarDatosGeneralesDesinstalacionParams = {
  servicioInternetId?: number | null;
  ticketId?: number | null;

  solicitadoPorId?: number | null;
  ejecutadoPorId?: number | null;

  tipo?: TipoDesinstalacionCliente;
  motivo?: MotivoDesinstalacionCliente | null;

  fechaProgramada?: Date | null;

  requiereRetiroEquipo?: boolean;

  direccionServicio?: string | null;
  referenciaUbicacion?: string | null;
  latitud?: number | null;
  longitud?: number | null;

  observaciones?: string | null;
  metadata?: unknown;
};

// PARAMETROS DE COMPORTAMIENTO
export type ReprogramarClienteDesinstalacionParams = {
  fechaProgramada: Date;
  motivo?: MotivoDesinstalacionCliente | null;
  observaciones?: string | null;
};

export type IniciarClienteDesinstalacionParams = {
  fechaInicio?: Date;
  ejecutadoPorId?: number | null;
};

export type CompletarClienteDesinstalacionParams = {
  ejecutadoPorId: number;
  resultado?: string | null;
  observaciones?: string | null;
  fechaFinalizacion?: Date;
  equipoRecuperado?: boolean;
  conforme?: boolean | null;
};

export type CancelarClienteDesinstalacionParams = {
  motivo?: MotivoDesinstalacionCliente | null;
  observaciones?: string | null;
  fechaCancelacion?: Date;
};

export type MarcarFallidaClienteDesinstalacionParams = {
  motivo?: MotivoDesinstalacionCliente | null;
  resultado?: string | null;
  observaciones?: string | null;
  fechaFinalizacion?: Date;
};

export type RegistrarFirmaClienteDesinstalacionParams = {
  firmadoPor: string;
  dpiFirmante?: string | null;
  conforme: boolean;
};

export type ActualizarCostosDesinstalacionParams = {
  saldoClienteAlMomento?: Money;
  costoDesinstalacion?: Money;
  costoTransporte?: Money;
  costoManoObra?: Money;
  costoOtros?: Money;
};
