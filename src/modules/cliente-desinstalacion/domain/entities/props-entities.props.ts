import { Money } from 'src/shared/domain/value-objects/money.vo';

import { EstadoDesinstalacionCliente } from '../enums/estado-desinstalacion-cliente.enum';

import { MotivoDesinstalacionCliente } from '../enums/motivo-desinstalacion-cliente.enum';

import { TipoDesinstalacionCliente } from '../enums/tipo-desinstalacion-cliente.enum';

/**
 * Estado completo del agregado ClienteDesinstalacion.
 */
export type ClienteDesinstalacionProps = {
  id?: number;

  empresaId: number;

  clienteId: number;

  servicioInternetId?: number | null;

  ticketId?: number | null;

  /**
   * Acceso de internet específico que será retirado.
   *
   * Es opcional porque algunos registros pueden representar:
   *
   * - retiro únicamente de equipo;
   * - operaciones históricas;
   * - servicios que no utilizan acceso automatizado.
   */
  accesoInternetId?: number | null;

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

/**
 * Propiedades permitidas al crear una desinstalación.
 */
export type CrearClienteDesinstalacionProps = {
  empresaId: number;

  clienteId: number;

  servicioInternetId?: number | null;

  ticketId?: number | null;

  accesoInternetId?: number | null;

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

/**
 * Propiedades editables sin ejecutar una transición
 * de estado.
 */
export type ActualizarDatosGeneralesDesinstalacionParams = {
  servicioInternetId?: number | null;

  ticketId?: number | null;

  accesoInternetId?: number | null;

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

/**
 * Reprograma una desinstalación que todavía
 * permanece PROGRAMADA.
 */
export type ReprogramarClienteDesinstalacionParams = {
  fechaProgramada: Date;

  motivo?: MotivoDesinstalacionCliente | null;

  observaciones?: string | null;
};

/**
 * Inicia la ejecución física de la desinstalación.
 */
export type IniciarClienteDesinstalacionParams = {
  fechaInicio?: Date;

  ejecutadoPorId?: number | null;
};

/**
 * Finaliza satisfactoriamente el trabajo físico.
 */
export type CompletarClienteDesinstalacionParams = {
  ejecutadoPorId: number;

  resultado?: string | null;

  observaciones?: string | null;

  fechaFinalizacion?: Date;

  equipoRecuperado?: boolean;

  conforme?: boolean | null;
};

/**
 * Cancela una desinstalación que todavía no ha
 * finalizado.
 */
export type CancelarClienteDesinstalacionParams = {
  motivo?: MotivoDesinstalacionCliente | null;

  observaciones?: string | null;

  fechaCancelacion?: Date | null;
};

/**
 * Finaliza la ejecución física como FALLIDA.
 *
 * Una operación PPPoE FALLIDA o PARCIAL puede dejar
 * la desinstalación EN_PROCESO hasta que se decida
 * explícitamente marcarla como fallida.
 */
export type MarcarFallidaClienteDesinstalacionParams = {
  motivo?: MotivoDesinstalacionCliente | null;

  resultado?: string | null;

  observaciones?: string | null;

  fechaFinalizacion?: Date;
};

/**
 * Registra la conformidad o inconformidad de quien
 * recibe el retiro.
 */
export type RegistrarFirmaClienteDesinstalacionParams = {
  firmadoPor: string;

  dpiFirmante?: string | null;

  conforme: boolean;
};

/**
 * Actualiza los importes relacionados con la
 * desinstalación.
 */
export type ActualizarCostosDesinstalacionParams = {
  saldoClienteAlMomento?: Money;

  costoDesinstalacion?: Money;

  costoTransporte?: Money;

  costoManoObra?: Money;

  costoOtros?: Money;
};
