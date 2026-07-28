/**
 * Contrato paginado común del proyecto:
 *
 * {
 *   data: T[];
 *   meta: {
 *     total: number;
 *     page: number;
 *     limit: number;
 *     totalPages: number;
 *   };
 * }
 */
import { PaginatedResult } from 'src/Utils/pagination';

/**
 * Estado de negocio de la cuenta PPPoE asociada
 * a una operación técnica.
 */
import { EstadoCuentaPppoe } from '../../../pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

/**
 * Enum compartido con el módulo de auditoría.
 *
 * Indica quién o qué originó la operación:
 * operador, sistema, cobranza automática, etc.
 */
import { OrigenOperacionPppoe } from '../../../pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

/**
 * Enums propios del módulo de operaciones PPPoE.
 */
import {
  CanalOperacionPppoe,
  EstadoOperacionPppoe,
  EstadoPasoPppoe,
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from '../enums/pppoe-operacion-operacion-paso.enums';

/**
 * Resultado general sanitizado almacenado
 * al finalizar una operación.
 */
import { PppoeOperacionResultado } from '../props/pppoe-operacion.props';

/**
 * ============================================================
 * READ MODEL DE PASOS TÉCNICOS
 * ============================================================
 */

/**
 * Representa un paso técnico ejecutado dentro de una operación.
 *
 * Ejemplos:
 *
 * - CONECTAR_ROUTER
 * - BUSCAR_SECRET
 * - AGREGAR_SECRET
 * - CONFIRMAR_SECRET
 *
 * Este modelo puede devolverse en el detalle de una operación.
 */
export type PppoeOperacionPasoReadModel = {
  /**
   * Identificador del paso.
   */
  id: number;

  /**
   * Operación principal a la que pertenece.
   */
  operacionId: number;

  /**
   * Acción técnica que representa el paso.
   */
  tipo: TipoPasoPppoe;

  /**
   * Posición del paso dentro de la secuencia.
   */
  orden: number;

  /**
   * Estado actual o final del paso.
   */
  estado: EstadoPasoPppoe;

  /**
   * Representación segura del comando ejecutado.
   *
   * Nunca debe contener contraseñas ni material sensible.
   */
  comandoSanitizado: string | null;

  /**
   * Respuesta técnica limpia y segura.
   *
   * No debe incluir stdout o stderr sin sanitización.
   */
  respuestaSanitizada: string | null;

  /**
   * Código técnico normalizado cuando el paso falla.
   */
  errorCodigo: string | null;

  /**
   * Mensaje de error seguro para diagnóstico.
   */
  errorMensaje: string | null;

  /**
   * Fecha en que comenzó la ejecución del paso.
   */
  iniciadoEn: Date | null;

  /**
   * Fecha en que terminó la ejecución del paso.
   */
  finalizadoEn: Date | null;

  /**
   * Tiempo total de ejecución del paso en milisegundos.
   */
  duracionMs: number | null;

  /**
   * Fecha de creación del registro.
   */
  creadoEn: Date;

  /**
   * Fecha de última actualización.
   */
  actualizadoEn: Date;
};

/**
 * ============================================================
 * RESÚMENES DE RELACIONES
 * ============================================================
 */

/**
 * Información resumida de un usuario relacionado
 * con una operación.
 *
 * Puede representar:
 *
 * - quien inició la operación;
 * - quien realizó la reautenticación.
 */
export type PppoeOperacionUsuarioResumen = {
  id: number;

  nombre: string;

  correo: string;

  telefono: string | null;

  rol: string;

  activo: boolean;
};

/**
 * Información mínima de la empresa propietaria
 * de la operación.
 */
export type PppoeOperacionEmpresaResumen = {
  id: number;

  nombre: string;
};

/**
 * Información resumida del cliente asociado
 * a la cuenta PPPoE.
 */
export type PppoeOperacionClienteResumen = {
  id: number;

  nombre: string;

  apellidos: string | null;

  telefono: string | null;

  dpi: string | null;

  direccion: string | null;
};

/**
 * Información resumida del servicio o plan de Internet.
 */
export type PppoeOperacionServicioResumen = {
  id: number;

  nombre: string;

  velocidad: string | null;

  precio: number;

  estado: string;
};

/**
 * Información segura del router MikroTik utilizado.
 *
 * No incluye:
 *
 * - usuario SSH;
 * - contraseña SSH;
 * - material cifrado.
 */
export type PppoeOperacionRouterResumen = {
  id: number;

  nombre: string;

  host: string;

  sshPort: number;

  descripcion: string | null;

  activo: boolean;
};

/**
 * Información resumida del acceso de Internet
 * relacionado con la cuenta PPPoE.
 */
export type PppoeOperacionAccesoResumen = {
  id: number;

  clienteId: number;

  servicioInternetId: number | null;

  tecnologia: string;

  metodoAutenticacion: string;

  estado: string;

  /**
   * Cliente propietario del acceso.
   */
  cliente: PppoeOperacionClienteResumen;

  /**
   * Servicio de Internet asociado al acceso.
   */
  servicioInternet: PppoeOperacionServicioResumen | null;
};

/**
 * Información segura de la cuenta PPPoE.
 *
 * No incluye:
 *
 * - contraseña descifrada;
 * - secreto cifrado;
 * - IV;
 * - authTag;
 * - versión de clave.
 */
export type PppoeOperacionCuentaResumen = {
  id: number;

  accesoInternetId: number;

  perfilHomologacionId: number;

  usuario: string;

  estado: EstadoCuentaPppoe;

  generadoEn: Date;

  /**
   * Fecha en que el secret fue confirmado
   * como creado en MikroTik.
   */
  secretCreadoEn: Date | null;

  activadoEn: Date | null;

  suspendidoEn: Date | null;

  eliminadoEn: Date | null;

  ultimaSincronizacionEn: Date | null;

  ultimoError: string | null;

  /**
   * Acceso de Internet al que pertenece la cuenta.
   */
  accesoInternet: PppoeOperacionAccesoResumen;
};

/**
 * Información resumida de la homologación utilizada
 * para resolver el código de perfil de MikroTik.
 */
export type PppoeOperacionPerfilResumen = {
  id: number;

  mikrotikRouterId: number;

  servicioInternetId: number;

  codigoPerfil: string;

  activo: boolean;

  servicioInternet: PppoeOperacionServicioResumen;
};

/**
 * Información resumida de la instalación
 * que originó una operación PPPoE.
 */
export type PppoeOperacionInstalacionResumen = {
  id: number;

  clienteId: number;

  servicioInternetId: number | null;

  tipo: string;

  estado: string;

  fechaProgramada: Date | null;

  fechaInicio: Date | null;

  fechaFinalizacion: Date | null;
};

/**
 * Información resumida de la desinstalación
 * que originó una operación PPPoE.
 */
export type PppoeOperacionDesinstalacionResumen = {
  id: number;

  clienteId: number;

  servicioInternetId: number | null;

  accesoInternetId: number | null;

  tipo: string;

  motivo: string | null;

  estado: string;

  fechaProgramada: Date | null;

  fechaInicio: Date | null;

  fechaFinalizacion: Date | null;
};

/**
 * ============================================================
 * REINTENTOS Y CONTEOS
 * ============================================================
 */

/**
 * Información reducida de una operación perteneciente
 * a la misma cadena de reintentos.
 */
export type PppoeOperacionReintentoResumen = {
  id: number;

  numeroIntento: number;

  estado: EstadoOperacionPppoe;

  errorCodigo: string | null;

  errorMensaje: string | null;

  iniciadoEn: Date | null;

  finalizadoEn: Date | null;

  creadoEn: Date;
};

/**
 * Conteos agregados utilizados en listados.
 *
 * Permiten mostrar cantidades sin cargar todos
 * los registros relacionados.
 */
export type PppoeOperacionConteos = {
  pasos: number;

  auditorias: number;

  reintentos: number;
};

/**
 * ============================================================
 * ITEM PARA LISTADO PAGINADO
 * ============================================================
 */

/**
 * Representa una operación PPPoE enriquecida para listados.
 *
 * Se utilizará principalmente en:
 *
 * GET /pppoe-operaciones
 *
 * Incluye relaciones resumidas y conteos, pero no carga
 * todos los pasos ni todos los reintentos.
 */
export type PppoeOperacionListItem = {
  /**
   * ==========================================================
   * IDENTIFICADORES PRINCIPALES
   * ==========================================================
   */

  id: number;

  empresaId: number;

  cuentaPppoeId: number;

  mikrotikRouterId: number;

  perfilHomologacionId: number | null;

  instalacionId: number | null;

  desinstalacionId: number | null;

  /**
   * ==========================================================
   * REINTENTOS E IDEMPOTENCIA
   * ==========================================================
   */

  /**
   * Operación anterior o raíz de la cadena de reintentos.
   */
  reintentoDeId: number | null;

  /**
   * Número correlativo del intento.
   */
  numeroIntento: number;

  /**
   * Clave utilizada para evitar crear dos veces
   * la misma operación accidentalmente.
   */
  claveIdempotencia: string;

  /**
   * ==========================================================
   * CLASIFICACIÓN DE LA OPERACIÓN
   * ==========================================================
   */

  /**
   * Acción general que se intenta realizar.
   *
   * Ejemplos:
   *
   * - CREAR_SECRET
   * - ACTIVAR_SECRET
   * - SUSPENDER_SERVICIO
   * - ELIMINAR_SECRET
   */
  tipo: TipoOperacionPppoe;

  /**
   * Actor o proceso que originó la operación.
   */
  origen: OrigenOperacionPppoe;

  /**
   * Medio técnico utilizado.
   *
   * Ejemplos:
   *
   * - SSH
   * - ROUTEROS_API
   * - MANUAL
   */
  canal: CanalOperacionPppoe;

  /**
   * Estado general del intento técnico.
   */
  estado: EstadoOperacionPppoe;

  /**
   * ==========================================================
   * OPERADORES Y AUTORIZACIÓN
   * ==========================================================
   */

  /**
   * Usuario que inició la operación.
   */
  iniciadoPorId: number | null;

  /**
   * Usuario que confirmó la reautenticación.
   */
  reautenticadoPorId: number | null;

  /**
   * Indica si la operación exige validación adicional.
   */
  requiereReautenticacion: boolean;

  /**
   * Resultado de la validación adicional.
   */
  reautenticacionExitosa: boolean | null;

  /**
   * Fecha en que se confirmó la reautenticación.
   */
  reautenticadoEn: Date | null;

  /**
   * ==========================================================
   * SNAPSHOTS HISTÓRICOS NO SENSIBLES
   * ==========================================================
   */

  /**
   * Usuario PPPoE utilizado durante el intento.
   */
  usuarioPppoeSnapshot: string;

  /**
   * Código de perfil utilizado durante el intento.
   */
  codigoPerfilSnapshot: string | null;

  /**
   * Host del router utilizado durante el intento.
   */
  routerHostSnapshot: string | null;

  /**
   * Puerto administrativo utilizado durante el intento.
   */
  routerPuertoSnapshot: number | null;

  /**
   * ==========================================================
   * RESULTADO GENERAL
   * ==========================================================
   */

  /**
   * Razón funcional o administrativa de la operación.
   */
  motivo: string | null;

  /**
   * Resultado técnico sanitizado.
   */
  resultado: PppoeOperacionResultado | null;

  /**
   * Código general del error.
   */
  errorCodigo: string | null;

  /**
   * Mensaje general del error.
   */
  errorMensaje: string | null;

  /**
   * ==========================================================
   * FECHAS Y DURACIÓN
   * ==========================================================
   */

  iniciadoEn: Date | null;

  finalizadoEn: Date | null;

  canceladoEn: Date | null;

  duracionMs: number | null;

  creadoEn: Date;

  actualizadoEn: Date;

  /**
   * ==========================================================
   * RELACIONES POBLADAS
   * ==========================================================
   */

  empresa: PppoeOperacionEmpresaResumen;

  cuentaPppoe: PppoeOperacionCuentaResumen;

  mikrotikRouter: PppoeOperacionRouterResumen;

  perfilHomologacion: PppoeOperacionPerfilResumen | null;

  instalacion: PppoeOperacionInstalacionResumen | null;

  desinstalacion: PppoeOperacionDesinstalacionResumen | null;

  iniciadoPor: PppoeOperacionUsuarioResumen | null;

  reautenticadoPor: PppoeOperacionUsuarioResumen | null;

  /**
   * Operación de la cual proviene este reintento.
   */
  reintentoDe: PppoeOperacionReintentoResumen | null;

  /**
   * Cantidad de relaciones hijas.
   */
  conteos: PppoeOperacionConteos;
};

/**
 * ============================================================
 * DETALLE DE OPERACIÓN
 * ============================================================
 */

/**
 * Representa el detalle completo de una operación.
 *
 * Se utilizará principalmente en:
 *
 * GET /pppoe-operaciones/:id
 *
 * Extiende el item del listado y agrega:
 *
 * - pasos técnicos;
 * - reintentos relacionados.
 *
 * Las auditorías completas se consultarán por separado mediante:
 *
 * GET /pppoe-auditoria?operacionId=:id
 */
export type PppoeOperacionDetalle = PppoeOperacionListItem & {
  pasos: PppoeOperacionPasoReadModel[];

  reintentos: PppoeOperacionReintentoResumen[];
};

/**
 * ============================================================
 * FILTROS DEL LISTADO PAGINADO
 * ============================================================
 */

/**
 * Filtros soportados por el listado administrativo
 * de operaciones PPPoE.
 *
 * Todos los filtros opcionales pueden recibirse como
 * null o undefined.
 */
export type PppoeOperacionFindManyFilters = {
  /**
   * Empresa propietaria de las operaciones.
   */
  empresaId: number;

  /**
   * Página solicitada.
   */
  page: number;

  /**
   * Cantidad de registros por página.
   */
  limit: number;

  /**
   * Búsqueda libre sobre usuario, cliente, router,
   * perfil, motivo y errores.
   */
  search?: string | null;

  /**
   * ==========================================================
   * FILTROS POR RELACIONES
   * ==========================================================
   */

  cuentaPppoeId?: number | null;

  mikrotikRouterId?: number | null;

  perfilHomologacionId?: number | null;

  instalacionId?: number | null;

  desinstalacionId?: number | null;

  iniciadoPorId?: number | null;

  reautenticadoPorId?: number | null;

  reintentoDeId?: number | null;

  /**
   * ==========================================================
   * FILTROS POR ENUMS
   * ==========================================================
   */

  tipos?: TipoOperacionPppoe[] | null;

  origenes?: OrigenOperacionPppoe[] | null;

  canales?: CanalOperacionPppoe[] | null;

  estados?: EstadoOperacionPppoe[] | null;

  /**
   * ==========================================================
   * FILTROS FUNCIONALES
   * ==========================================================
   */

  requiereReautenticacion?: boolean | null;

  numeroIntento?: number | null;

  /**
   * ==========================================================
   * RANGO DE FECHAS
   * ==========================================================
   */

  fechaDesde?: Date | null;

  fechaHasta?: Date | null;

  /**
   * ==========================================================
   * ORDENAMIENTO
   * ==========================================================
   */

  ordenPor?: 'creadoEn' | 'iniciadoEn' | 'finalizadoEn' | 'numeroIntento';

  ordenDireccion?: 'asc' | 'desc';
};

/**
 * ============================================================
 * RESULTADO PAGINADO
 * ============================================================
 */

/**
 * Resultado estándar del listado de operaciones PPPoE.
 *
 * Forma de respuesta:
 *
 * {
 *   data: PppoeOperacionListItem[];
 *   meta: {
 *     total: number;
 *     page: number;
 *     limit: number;
 *     totalPages: number;
 *   };
 * }
 */
export type PppoeOperacionPaginatedResult =
  PaginatedResult<PppoeOperacionListItem>;
