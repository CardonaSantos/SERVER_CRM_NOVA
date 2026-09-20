import { OrigenOperacionPppoe } from '../../../pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

import {
  CanalOperacionPppoe,
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
} from '../enums/pppoe-operacion-operacion-paso.enums';

import {
  CrearPppoeOperacionProps,
  PppoeOperacionProps,
  PppoeOperacionResultado,
} from '../props/pppoe-operacion.props';

/**
 * Datos necesarios para autorizar una operación que requiere
 * reautenticación del operador.
 */
export type AutorizarPppoeOperacionInput = {
  reautenticadoPorId: number;

  /**
   * Fecha real de autorización.
   *
   * Si se omite, se utiliza la fecha actual.
   */
  fecha?: Date;
};

/**
 * Registra una validación de contraseña fallida.
 *
 * La operación permanece PENDIENTE y todavía puede volver
 * a intentar autorizarse.
 */
export type RegistrarReautenticacionFallidaInput = {
  reautenticadoPorId: number;

  fecha?: Date;
};

/**
 * Datos utilizados al iniciar la ejecución remota.
 */
export type IniciarPppoeOperacionInput = {
  fecha?: Date;
};

/**
 * Datos utilizados para finalizar exitosamente una operación.
 */
export type MarcarPppoeOperacionExitosaInput = {
  /**
   * Resumen técnico sanitizado.
   *
   * Nunca debe contener contraseñas, tokens, comandos
   * completos ni material criptográfico.
   */
  resultado?: PppoeOperacionResultado | null;

  fecha?: Date;
};

/**
 * Datos utilizados para finalizar una operación como
 * PARCIAL o FALLIDA.
 */
export type MarcarPppoeOperacionConErrorInput = {
  errorCodigo: string;

  errorMensaje: string;

  /**
   * Información técnica obtenida antes del fallo.
   */
  resultado?: PppoeOperacionResultado | null;

  fecha?: Date;
};

/**
 * Datos necesarios para cancelar una operación antes
 * de que comience su ejecución técnica.
 */
export type CancelarPppoeOperacionInput = {
  motivo: string;

  fecha?: Date;
};

/**
 * Datos necesarios para construir un nuevo intento a partir
 * de una operación FALLIDA o PARCIAL.
 */
export type CrearReintentoPppoeOperacionInput = {
  /**
   * Debe ser una clave nueva para el nuevo intento.
   */
  claveIdempotencia: string;

  /**
   * Responsable del nuevo intento.
   *
   * Debe enviarse explícitamente para no atribuir el
   * reintento al operador anterior por accidente.
   */
  iniciadoPorId: number | null;

  /**
   * Puede cambiar si el reintento fue disparado por
   * otro actor o proceso.
   */
  origen?: OrigenOperacionPppoe;

  /**
   * Permite reintentar mediante otro canal.
   */
  canal?: CanalOperacionPppoe;

  /**
   * Política de autorización del nuevo intento.
   */
  requiereReautenticacion?: boolean;

  motivo?: string | null;

  /**
   * Permite actualizar el contexto de homologación si cambió
   * después del intento anterior.
   */
  perfilHomologacionId?: number | null;

  codigoPerfilSnapshot?: string | null;

  /**
   * Permite cambiar el destino cuando el router fue corregido
   * o sustituido.
   */

  mikrotikRouterId: number;

  routerHostSnapshot: string;

  routerPuertoSnapshot: number;
};

/**
 * Primitivos válidos para crear un registro nuevo.
 *
 * El id todavía no existe.
 */
export type PppoeOperacionCreatePrimitives = Omit<PppoeOperacionProps, 'id'>;

/**
 * Primitivos correspondientes a una entidad ya persistida.
 */
export type PppoeOperacionPersistedPrimitives = PppoeOperacionProps & {
  id: number;
};

/**
 * Entidad raíz de una operación técnica PPPoE.
 *
 * Representa un intento completo contra MikroTik:
 *
 * - CREAR_SECRET;
 * - ACTIVAR_SECRET;
 * - SUSPENDER_SERVICIO;
 * - ELIMINAR_SECRET.
 *
 * Los pasos técnicos pertenecen al agregado, pero se modelan
 * mediante PppoeOperacionPasoEntity.
 *
 * Flujo con reautenticación:
 *
 * PENDIENTE
 *   -> AUTORIZADA
 *   -> EJECUTANDO
 *   -> EXITOSA | PARCIAL | FALLIDA
 *
 * Flujo sin reautenticación:
 *
 * PENDIENTE
 *   -> EJECUTANDO
 *   -> EXITOSA | PARCIAL | FALLIDA
 *
 * Una operación PENDIENTE o AUTORIZADA puede cancelarse.
 */
export class PppoeOperacionEntity {
  private static readonly MAX_IDEMPOTENCIA_LENGTH = 200;

  private static readonly MAX_USUARIO_LENGTH = 160;

  private static readonly MAX_PERFIL_LENGTH = 160;

  private static readonly MAX_HOST_LENGTH = 255;

  private static readonly MAX_MOTIVO_LENGTH = 2_000;

  private static readonly MAX_ERROR_CODIGO_LENGTH = 120;

  private static readonly MAX_ERROR_MENSAJE_LENGTH = 4_000;

  private static readonly MAX_RESULTADO_LENGTH = 50_000;

  /**
   * Claves prohibidas dentro de resultado.
   *
   * Se comparan por nombre exacto normalizado para permitir
   * claves seguras como:
   *
   * - secretEncontrado;
   * - secretCreado;
   * - secretConfirmado.
   */
  private static readonly SENSITIVE_RESULT_KEYS = new Set<string>([
    'password',
    'passwd',
    'pass',
    'contrasena',
    'clave',
    'clavepppoe',
    'passwordpppoe',
    'secreto',
    'secretocifrado',
    'secretoiv',
    'secretoauthtag',
    'token',
    'authorization',
    'privatekey',
    'sshpassword',
    'aeskey',
  ]);

  /**
   * El constructor es privado para obligar a utilizar:
   *
   * - create(): operación nueva;
   * - restore(): operación obtenida desde persistencia.
   */
  private constructor(private props: PppoeOperacionProps) {}

  /**
   * ==========================================================
   * CONSTRUCCIÓN
   * ==========================================================
   */

  /**
   * Crea una operación nueva en estado PENDIENTE.
   *
   * No permite definir manualmente:
   *
   * - estado;
   * - reautenticación;
   * - resultado;
   * - errores;
   * - fechas de ejecución;
   * - duración.
   */
  static create(input: CrearPppoeOperacionProps): PppoeOperacionEntity {
    const now = new Date();

    const props: PppoeOperacionProps = {
      id: null,

      empresaId: this.normalizePositiveInteger(input.empresaId, 'empresaId'),

      cuentaPppoeId: this.normalizePositiveInteger(
        input.cuentaPppoeId,
        'cuentaPppoeId',
      ),

      mikrotikRouterId: this.normalizePositiveInteger(
        input.mikrotikRouterId,
        'mikrotikRouterId',
      ),

      perfilHomologacionId: this.normalizeOptionalPositiveInteger(
        input.perfilHomologacionId ?? null,
        'perfilHomologacionId',
      ),

      instalacionId: this.normalizeOptionalPositiveInteger(
        input.instalacionId ?? null,
        'instalacionId',
      ),

      desinstalacionId: this.normalizeOptionalPositiveInteger(
        input.desinstalacionId ?? null,
        'desinstalacionId',
      ),

      reintentoDeId: this.normalizeOptionalPositiveInteger(
        input.reintentoDeId ?? null,
        'reintentoDeId',
      ),

      numeroIntento: this.normalizePositiveInteger(
        input.numeroIntento ?? 1,
        'numeroIntento',
      ),

      claveIdempotencia: this.normalizeRequiredString(
        input.claveIdempotencia,
        'claveIdempotencia',
        this.MAX_IDEMPOTENCIA_LENGTH,
      ),

      tipo: this.normalizeEnumValue(input.tipo, TipoOperacionPppoe, 'tipo'),

      origen: this.normalizeEnumValue(
        input.origen,
        OrigenOperacionPppoe,
        'origen',
      ),

      canal: this.normalizeEnumValue(
        input.canal ?? CanalOperacionPppoe.SSH,
        CanalOperacionPppoe,
        'canal',
      ),

      estado: EstadoOperacionPppoe.PENDIENTE,

      iniciadoPorId: this.normalizeOptionalPositiveInteger(
        input.iniciadoPorId ?? null,
        'iniciadoPorId',
      ),

      reautenticadoPorId: null,

      requiereReautenticacion: input.requiereReautenticacion ?? false,

      reautenticacionExitosa: null,

      reautenticadoEn: null,

      usuarioPppoeSnapshot: this.normalizeRequiredString(
        input.usuarioPppoeSnapshot,
        'usuarioPppoeSnapshot',
        this.MAX_USUARIO_LENGTH,
      ),

      codigoPerfilSnapshot: this.normalizeOptionalString(
        input.codigoPerfilSnapshot ?? null,
        'codigoPerfilSnapshot',
        this.MAX_PERFIL_LENGTH,
      ),

      routerHostSnapshot: this.normalizeRequiredString(
        input.routerHostSnapshot,
        'routerHostSnapshot',
        this.MAX_HOST_LENGTH,
      ),

      routerPuertoSnapshot: this.normalizeNetworkPort(
        input.routerPuertoSnapshot,
        'routerPuertoSnapshot',
      ),

      motivo: this.normalizeOptionalString(
        input.motivo ?? null,
        'motivo',
        this.MAX_MOTIVO_LENGTH,
      ),

      resultado: null,

      errorCodigo: null,

      errorMensaje: null,

      iniciadoEn: null,

      finalizadoEn: null,

      canceladoEn: null,

      duracionMs: null,

      creadoEn: now,

      actualizadoEn: now,
    };

    this.assertGeneralConsistency(props);

    this.assertStateConsistency(props);

    return new PppoeOperacionEntity(props);
  }

  /**
   * Restaura una operación previamente persistida.
   *
   * Este método debe utilizarse en el mapper Prisma.
   */
  static restore(input: PppoeOperacionProps): PppoeOperacionEntity {
    if (input.id === null) {
      throw new Error('No se puede restaurar una operación PPPoE sin id.');
    }

    const props: PppoeOperacionProps = {
      id: this.normalizePositiveInteger(input.id, 'id'),

      empresaId: this.normalizePositiveInteger(input.empresaId, 'empresaId'),

      cuentaPppoeId: this.normalizePositiveInteger(
        input.cuentaPppoeId,
        'cuentaPppoeId',
      ),

      mikrotikRouterId: this.normalizePositiveInteger(
        input.mikrotikRouterId,
        'mikrotikRouterId',
      ),

      perfilHomologacionId: this.normalizeOptionalPositiveInteger(
        input.perfilHomologacionId,
        'perfilHomologacionId',
      ),

      instalacionId: this.normalizeOptionalPositiveInteger(
        input.instalacionId,
        'instalacionId',
      ),

      desinstalacionId: this.normalizeOptionalPositiveInteger(
        input.desinstalacionId,
        'desinstalacionId',
      ),

      reintentoDeId: this.normalizeOptionalPositiveInteger(
        input.reintentoDeId,
        'reintentoDeId',
      ),

      numeroIntento: this.normalizePositiveInteger(
        input.numeroIntento,
        'numeroIntento',
      ),

      claveIdempotencia: this.normalizeRequiredString(
        input.claveIdempotencia,
        'claveIdempotencia',
        this.MAX_IDEMPOTENCIA_LENGTH,
      ),

      tipo: this.normalizeEnumValue(input.tipo, TipoOperacionPppoe, 'tipo'),

      origen: this.normalizeEnumValue(
        input.origen,
        OrigenOperacionPppoe,
        'origen',
      ),

      canal: this.normalizeEnumValue(input.canal, CanalOperacionPppoe, 'canal'),

      estado: this.normalizeEnumValue(
        input.estado,
        EstadoOperacionPppoe,
        'estado',
      ),

      iniciadoPorId: this.normalizeOptionalPositiveInteger(
        input.iniciadoPorId,
        'iniciadoPorId',
      ),

      reautenticadoPorId: this.normalizeOptionalPositiveInteger(
        input.reautenticadoPorId,
        'reautenticadoPorId',
      ),

      requiereReautenticacion: Boolean(input.requiereReautenticacion),

      reautenticacionExitosa: input.reautenticacionExitosa,

      reautenticadoEn: this.normalizeOptionalDate(
        input.reautenticadoEn,
        'reautenticadoEn',
      ),

      usuarioPppoeSnapshot: this.normalizeRequiredString(
        input.usuarioPppoeSnapshot,
        'usuarioPppoeSnapshot',
        this.MAX_USUARIO_LENGTH,
      ),

      codigoPerfilSnapshot: this.normalizeOptionalString(
        input.codigoPerfilSnapshot,
        'codigoPerfilSnapshot',
        this.MAX_PERFIL_LENGTH,
      ),

      routerHostSnapshot: this.normalizeOptionalString(
        input.routerHostSnapshot,
        'routerHostSnapshot',
        this.MAX_HOST_LENGTH,
      ),

      routerPuertoSnapshot: this.normalizeOptionalNetworkPort(
        input.routerPuertoSnapshot,
        'routerPuertoSnapshot',
      ),

      motivo: this.normalizeOptionalString(
        input.motivo,
        'motivo',
        this.MAX_MOTIVO_LENGTH,
      ),

      resultado: this.normalizeResult(input.resultado),

      errorCodigo: this.normalizeErrorCode(input.errorCodigo),

      errorMensaje: this.normalizeOptionalString(
        input.errorMensaje,
        'errorMensaje',
        this.MAX_ERROR_MENSAJE_LENGTH,
      ),

      iniciadoEn: this.normalizeOptionalDate(input.iniciadoEn, 'iniciadoEn'),

      finalizadoEn: this.normalizeOptionalDate(
        input.finalizadoEn,
        'finalizadoEn',
      ),

      canceladoEn: this.normalizeOptionalDate(input.canceladoEn, 'canceladoEn'),

      duracionMs: this.normalizeOptionalDuration(input.duracionMs),

      creadoEn: this.normalizeRequiredDate(input.creadoEn, 'creadoEn'),

      actualizadoEn: this.normalizeRequiredDate(
        input.actualizadoEn,
        'actualizadoEn',
      ),
    };

    this.assertGeneralConsistency(props);

    this.assertTemporalConsistency(props);

    this.assertStateConsistency(props);

    return new PppoeOperacionEntity(props);
  }

  /**
   * ==========================================================
   * AUTORIZACIÓN
   * ==========================================================
   */

  /**
   * Autoriza una operación que requiere reautenticación.
   *
   * Transición:
   *
   * PENDIENTE -> AUTORIZADA
   */
  autorizar(input: AutorizarPppoeOperacionInput): void {
    this.assertCurrentState(
      EstadoOperacionPppoe.PENDIENTE,
      'Solo una operación PENDIENTE puede autorizarse.',
    );

    if (!this.props.requiereReautenticacion) {
      throw new Error(
        'Esta operación no requiere reautenticación y no debe pasar por AUTORIZADA.',
      );
    }

    const reautenticadoPorId = PppoeOperacionEntity.normalizePositiveInteger(
      input.reautenticadoPorId,
      'reautenticadoPorId',
    );

    const fecha = PppoeOperacionEntity.normalizeActionDate(
      input.fecha,
      'fecha de autorización',
    );

    this.assertDateNotBeforeCreation(fecha);

    this.props.estado = EstadoOperacionPppoe.AUTORIZADA;

    this.props.reautenticadoPorId = reautenticadoPorId;

    this.props.reautenticacionExitosa = true;

    this.props.reautenticadoEn = fecha;

    this.touch(fecha);
  }

  /**
   * Registra una reautenticación fallida.
   *
   * La operación permanece PENDIENTE.
   */
  registrarReautenticacionFallida(
    input: RegistrarReautenticacionFallidaInput,
  ): void {
    this.assertCurrentState(
      EstadoOperacionPppoe.PENDIENTE,
      'Solo una operación PENDIENTE puede registrar una reautenticación fallida.',
    );

    if (!this.props.requiereReautenticacion) {
      throw new Error('Esta operación no requiere reautenticación.');
    }

    const reautenticadoPorId = PppoeOperacionEntity.normalizePositiveInteger(
      input.reautenticadoPorId,
      'reautenticadoPorId',
    );

    const fecha = PppoeOperacionEntity.normalizeActionDate(
      input.fecha,
      'fecha de reautenticación',
    );

    this.assertDateNotBeforeCreation(fecha);

    this.props.reautenticadoPorId = reautenticadoPorId;

    this.props.reautenticacionExitosa = false;

    this.props.reautenticadoEn = fecha;

    this.touch(fecha);
  }

  /**
   * ==========================================================
   * EJECUCIÓN
   * ==========================================================
   */

  /**
   * Inicia la ejecución técnica de la operación.
   *
   * Sin reautenticación:
   *
   * PENDIENTE -> EJECUTANDO
   *
   * Con reautenticación:
   *
   * AUTORIZADA -> EJECUTANDO
   */
  iniciar(input: IniciarPppoeOperacionInput = {}): void {
    if (this.props.requiereReautenticacion) {
      this.assertCurrentState(
        EstadoOperacionPppoe.AUTORIZADA,
        'Una operación protegida debe estar AUTORIZADA antes de ejecutarse.',
      );

      if (
        this.props.reautenticacionExitosa !== true ||
        this.props.reautenticadoPorId === null ||
        this.props.reautenticadoEn === null
      ) {
        throw new Error('La operación no contiene una autorización válida.');
      }
    } else {
      this.assertCurrentState(
        EstadoOperacionPppoe.PENDIENTE,
        'Una operación sin reautenticación debe estar PENDIENTE antes de ejecutarse.',
      );
    }

    const fecha = PppoeOperacionEntity.normalizeActionDate(
      input.fecha,
      'fecha de inicio',
    );

    this.assertDateNotBeforeCreation(fecha);

    if (
      this.props.reautenticadoEn &&
      fecha.getTime() < this.props.reautenticadoEn.getTime()
    ) {
      throw new Error('iniciadoEn no puede ser anterior a reautenticadoEn.');
    }

    this.props.estado = EstadoOperacionPppoe.EJECUTANDO;

    this.props.iniciadoEn = fecha;

    this.props.finalizadoEn = null;

    this.props.canceladoEn = null;

    this.props.duracionMs = null;

    this.props.resultado = null;

    this.props.errorCodigo = null;

    this.props.errorMensaje = null;

    this.touch(fecha);
  }

  /**
   * Finaliza correctamente una operación.
   *
   * Transición:
   *
   * EJECUTANDO -> EXITOSA
   */
  marcarExitosa(input: MarcarPppoeOperacionExitosaInput = {}): void {
    this.assertCurrentState(
      EstadoOperacionPppoe.EJECUTANDO,
      'Solo una operación EJECUTANDO puede marcarse como EXITOSA.',
    );

    const fecha = PppoeOperacionEntity.normalizeActionDate(
      input.fecha,
      'fecha de finalización',
    );

    this.assertDateNotBeforeStart(fecha);

    this.props.estado = EstadoOperacionPppoe.EXITOSA;

    this.props.resultado = PppoeOperacionEntity.normalizeResult(
      input.resultado ?? null,
    );

    this.props.errorCodigo = null;

    this.props.errorMensaje = null;

    this.props.finalizadoEn = fecha;

    this.props.canceladoEn = null;

    this.props.duracionMs = this.calculateDuration(fecha);

    this.touch(fecha);
  }

  /**
   * Finaliza una operación cuyo efecto remoto no pudo
   * confirmarse completamente.
   *
   * Transición:
   *
   * EJECUTANDO -> PARCIAL
   */
  marcarParcial(input: MarcarPppoeOperacionConErrorInput): void {
    this.finishWithError(EstadoOperacionPppoe.PARCIAL, input);
  }

  /**
   * Finaliza una operación que no logró completar
   * el objetivo técnico.
   *
   * Transición:
   *
   * EJECUTANDO -> FALLIDA
   */
  marcarFallida(input: MarcarPppoeOperacionConErrorInput): void {
    this.finishWithError(EstadoOperacionPppoe.FALLIDA, input);
  }

  /**
   * Cancela una operación que todavía no comenzó.
   *
   * Transiciones válidas:
   *
   * PENDIENTE -> CANCELADA
   * AUTORIZADA -> CANCELADA
   */
  cancelar(input: CancelarPppoeOperacionInput): void {
    if (
      this.props.estado !== EstadoOperacionPppoe.PENDIENTE &&
      this.props.estado !== EstadoOperacionPppoe.AUTORIZADA
    ) {
      throw new Error(
        `Solo una operación PENDIENTE o AUTORIZADA puede cancelarse. Estado actual: ${this.props.estado}.`,
      );
    }

    const motivo = PppoeOperacionEntity.normalizeRequiredString(
      input.motivo,
      'motivo',
      PppoeOperacionEntity.MAX_MOTIVO_LENGTH,
    );

    const fecha = PppoeOperacionEntity.normalizeActionDate(
      input.fecha,
      'fecha de cancelación',
    );

    this.assertDateNotBeforeCreation(fecha);

    if (
      this.props.reautenticadoEn &&
      fecha.getTime() < this.props.reautenticadoEn.getTime()
    ) {
      throw new Error('canceladoEn no puede ser anterior a reautenticadoEn.');
    }

    this.props.estado = EstadoOperacionPppoe.CANCELADA;

    this.props.motivo = motivo;

    this.props.canceladoEn = fecha;

    this.props.iniciadoEn = null;

    this.props.finalizadoEn = null;

    this.props.duracionMs = null;

    this.props.resultado = null;

    this.props.errorCodigo = null;

    this.props.errorMensaje = null;

    this.touch(fecha);
  }

  /**
   * ==========================================================
   * REINTENTOS
   * ==========================================================
   */

  /**
   * Construye una operación nueva vinculada a esta operación.
   *
   * Solo se permite reintentar operaciones:
   *
   * - FALLIDA;
   * - PARCIAL.
   *
   * La entidad actual no cambia.
   */
  crearReintento(
    input: CrearReintentoPppoeOperacionInput,
  ): PppoeOperacionEntity {
    if (!this.puedeReintentarse()) {
      throw new Error(
        `La operación ${this.props.estado} no puede reintentarse.`,
      );
    }

    if (this.props.id === null) {
      throw new Error(
        'No se puede reintentar una operación que todavía no fue persistida.',
      );
    }

    const operacionRaizId = this.props.reintentoDeId ?? this.props.id;
    const routerHostSnapshot = input.routerHostSnapshot;

    const routerPuertoSnapshot = input.routerPuertoSnapshot;

    if (typeof routerHostSnapshot !== 'string' || !routerHostSnapshot.trim()) {
      throw new Error('El reintento necesita routerHostSnapshot.');
    }

    if (
      !Number.isInteger(routerPuertoSnapshot) ||
      routerPuertoSnapshot < 1 ||
      routerPuertoSnapshot > 65_535
    ) {
      throw new Error('El reintento necesita un routerPuertoSnapshot válido.');
    }

    return PppoeOperacionEntity.create({
      empresaId: this.props.empresaId,

      cuentaPppoeId: this.props.cuentaPppoeId,

      // mikrotikRouterId: input.mikrotikRouterId ?? this.props.mikrotikRouterId,
      mikrotikRouterId: input.mikrotikRouterId,
      perfilHomologacionId:
        input.perfilHomologacionId !== undefined
          ? input.perfilHomologacionId
          : this.props.perfilHomologacionId,

      instalacionId: this.props.instalacionId,

      desinstalacionId: this.props.desinstalacionId,

      reintentoDeId: operacionRaizId,

      numeroIntento: this.props.numeroIntento + 1,

      claveIdempotencia: input.claveIdempotencia,

      tipo: this.props.tipo,

      origen: input.origen ?? this.props.origen,

      canal: input.canal ?? this.props.canal,

      iniciadoPorId: input.iniciadoPorId,

      requiereReautenticacion:
        input.requiereReautenticacion ?? this.props.requiereReautenticacion,

      motivo:
        input.motivo ?? `Reintento de la operación PPPoE ${this.props.id}.`,

      usuarioPppoeSnapshot: this.props.usuarioPppoeSnapshot,

      codigoPerfilSnapshot:
        input.codigoPerfilSnapshot !== undefined
          ? input.codigoPerfilSnapshot
          : this.props.codigoPerfilSnapshot,

      routerHostSnapshot,

      routerPuertoSnapshot,
    });
  }

  /**
   * ==========================================================
   * CONSULTAS DE DOMINIO
   * ==========================================================
   */

  /**
   * Indica si la operación todavía no comenzó.
   */
  estaPendiente(): boolean {
    return this.props.estado === EstadoOperacionPppoe.PENDIENTE;
  }

  /**
   * Indica si la operación superó la reautenticación.
   */
  estaAutorizada(): boolean {
    return this.props.estado === EstadoOperacionPppoe.AUTORIZADA;
  }

  /**
   * Indica si la operación está modificando el router.
   */
  estaEjecutando(): boolean {
    return this.props.estado === EstadoOperacionPppoe.EJECUTANDO;
  }

  /**
   * Indica si la operación terminó correctamente.
   */
  fueExitosa(): boolean {
    return this.props.estado === EstadoOperacionPppoe.EXITOSA;
  }

  /**
   * Indica si la operación terminó parcialmente.
   */
  fueParcial(): boolean {
    return this.props.estado === EstadoOperacionPppoe.PARCIAL;
  }

  /**
   * Indica si la operación terminó con error.
   */
  fueFallida(): boolean {
    return this.props.estado === EstadoOperacionPppoe.FALLIDA;
  }

  /**
   * Indica si la operación fue cancelada.
   */
  fueCancelada(): boolean {
    return this.props.estado === EstadoOperacionPppoe.CANCELADA;
  }

  /**
   * Indica si ya no admite nuevas transiciones.
   */
  esTerminal(): boolean {
    return [
      EstadoOperacionPppoe.EXITOSA,
      EstadoOperacionPppoe.PARCIAL,
      EstadoOperacionPppoe.FALLIDA,
      EstadoOperacionPppoe.CANCELADA,
    ].includes(this.props.estado);
  }

  /**
   * Indica si todavía representa una operación activa
   * sobre la cuenta PPPoE.
   */
  estaEnCurso(): boolean {
    return [
      EstadoOperacionPppoe.PENDIENTE,
      EstadoOperacionPppoe.AUTORIZADA,
      EstadoOperacionPppoe.EJECUTANDO,
    ].includes(this.props.estado);
  }

  /**
   * Indica si puede producirse un nuevo intento.
   */
  puedeReintentarse(): boolean {
    return [
      EstadoOperacionPppoe.PARCIAL,
      EstadoOperacionPppoe.FALLIDA,
    ].includes(this.props.estado);
  }

  /**
   * Indica si pertenece a una cadena de reintentos.
   */
  esReintento(): boolean {
    return this.props.reintentoDeId !== null || this.props.numeroIntento > 1;
  }

  /**
   * Ayuda a comprobar la pertenencia a una empresa
   * sin extraer todos los primitivos.
   */
  perteneceAEmpresa(empresaId: number): boolean {
    return this.props.empresaId === empresaId;
  }

  /**
   * Ayuda a comparar una operación con una cuenta PPPoE.
   */
  correspondeACuenta(cuentaPppoeId: number): boolean {
    return this.props.cuentaPppoeId === cuentaPppoeId;
  }

  /**
   * Ayuda a comprobar si la operación fue originada
   * por una instalación determinada.
   */
  correspondeAInstalacion(instalacionId: number): boolean {
    return this.props.instalacionId === instalacionId;
  }

  /**
   * ==========================================================
   * GETTERS
   * ==========================================================
   */

  get id(): number | null {
    return this.props.id;
  }

  get empresaId(): number {
    return this.props.empresaId;
  }

  get cuentaPppoeId(): number {
    return this.props.cuentaPppoeId;
  }

  get mikrotikRouterId(): number {
    return this.props.mikrotikRouterId;
  }

  get perfilHomologacionId(): number | null {
    return this.props.perfilHomologacionId;
  }

  get instalacionId(): number | null {
    return this.props.instalacionId;
  }

  get desinstalacionId(): number | null {
    return this.props.desinstalacionId;
  }

  get reintentoDeId(): number | null {
    return this.props.reintentoDeId;
  }

  get numeroIntento(): number {
    return this.props.numeroIntento;
  }

  get claveIdempotencia(): string {
    return this.props.claveIdempotencia;
  }

  get tipo(): TipoOperacionPppoe {
    return this.props.tipo;
  }

  get origen(): OrigenOperacionPppoe {
    return this.props.origen;
  }

  get canal(): CanalOperacionPppoe {
    return this.props.canal;
  }

  get estado(): EstadoOperacionPppoe {
    return this.props.estado;
  }

  get iniciadoPorId(): number | null {
    return this.props.iniciadoPorId;
  }

  get requiereReautenticacion(): boolean {
    return this.props.requiereReautenticacion;
  }

  get usuarioPppoeSnapshot(): string {
    return this.props.usuarioPppoeSnapshot;
  }

  get iniciadoEn(): Date | null {
    return this.cloneOptionalDate(this.props.iniciadoEn);
  }

  get finalizadoEn(): Date | null {
    return this.cloneOptionalDate(this.props.finalizadoEn);
  }

  get duracionMs(): number | null {
    return this.props.duracionMs;
  }

  /**
   * ==========================================================
   * CONVERSIÓN PARA MAPPERS
   * ==========================================================
   */

  /**
   * Devuelve una copia segura del estado completo.
   *
   * Puede utilizarse para:
   *
   * - persistencia;
   * - casos de uso;
   * - pruebas;
   * - comparación de cambios.
   */
  toPrimitives(): PppoeOperacionProps {
    return {
      id: this.props.id,

      empresaId: this.props.empresaId,

      cuentaPppoeId: this.props.cuentaPppoeId,

      mikrotikRouterId: this.props.mikrotikRouterId,

      perfilHomologacionId: this.props.perfilHomologacionId,

      instalacionId: this.props.instalacionId,

      desinstalacionId: this.props.desinstalacionId,

      reintentoDeId: this.props.reintentoDeId,

      numeroIntento: this.props.numeroIntento,

      claveIdempotencia: this.props.claveIdempotencia,

      tipo: this.props.tipo,

      origen: this.props.origen,

      canal: this.props.canal,

      estado: this.props.estado,

      iniciadoPorId: this.props.iniciadoPorId,

      reautenticadoPorId: this.props.reautenticadoPorId,

      requiereReautenticacion: this.props.requiereReautenticacion,

      reautenticacionExitosa: this.props.reautenticacionExitosa,

      reautenticadoEn: this.cloneOptionalDate(this.props.reautenticadoEn),

      usuarioPppoeSnapshot: this.props.usuarioPppoeSnapshot,

      codigoPerfilSnapshot: this.props.codigoPerfilSnapshot,

      routerHostSnapshot: this.props.routerHostSnapshot,

      routerPuertoSnapshot: this.props.routerPuertoSnapshot,

      motivo: this.props.motivo,

      resultado: PppoeOperacionEntity.cloneResult(this.props.resultado),

      errorCodigo: this.props.errorCodigo,

      errorMensaje: this.props.errorMensaje,

      iniciadoEn: this.cloneOptionalDate(this.props.iniciadoEn),

      finalizadoEn: this.cloneOptionalDate(this.props.finalizadoEn),

      canceladoEn: this.cloneOptionalDate(this.props.canceladoEn),

      duracionMs: this.props.duracionMs,

      creadoEn: new Date(this.props.creadoEn.getTime()),

      actualizadoEn: new Date(this.props.actualizadoEn.getTime()),
    };
  }

  /**
   * Devuelve primitivos listos para una inserción.
   *
   * Falla si la entidad ya tiene id.
   */
  toCreatePrimitives(): PppoeOperacionCreatePrimitives {
    if (this.props.id !== null) {
      throw new Error(
        'Una operación persistida no puede convertirse en datos de creación.',
      );
    }

    const { id: _id, ...createPrimitives } = this.toPrimitives();

    return createPrimitives;
  }

  /**
   * Devuelve primitivos de una entidad persistida.
   *
   * Falla si todavía no tiene id.
   */
  toPersistedPrimitives(): PppoeOperacionPersistedPrimitives {
    if (this.props.id === null) {
      throw new Error('La operación todavía no fue persistida.');
    }

    return {
      ...this.toPrimitives(),
      id: this.props.id,
    };
  }

  /**
   * ==========================================================
   * MÉTODOS INTERNOS DE INSTANCIA
   * ==========================================================
   */

  /**
   * Finalización común para PARCIAL y FALLIDA.
   */
  private finishWithError(
    estado: EstadoOperacionPppoe.PARCIAL | EstadoOperacionPppoe.FALLIDA,
    input: MarcarPppoeOperacionConErrorInput,
  ): void {
    this.assertCurrentState(
      EstadoOperacionPppoe.EJECUTANDO,
      `Solo una operación EJECUTANDO puede marcarse como ${estado}.`,
    );

    const errorCodigo = PppoeOperacionEntity.normalizeRequiredErrorCode(
      input.errorCodigo,
    );

    const errorMensaje = PppoeOperacionEntity.normalizeRequiredString(
      input.errorMensaje,
      'errorMensaje',
      PppoeOperacionEntity.MAX_ERROR_MENSAJE_LENGTH,
    );

    const fecha = PppoeOperacionEntity.normalizeActionDate(
      input.fecha,
      'fecha de finalización',
    );

    this.assertDateNotBeforeStart(fecha);

    this.props.estado = estado;

    this.props.resultado = PppoeOperacionEntity.normalizeResult(
      input.resultado ?? null,
    );

    this.props.errorCodigo = errorCodigo;

    this.props.errorMensaje = errorMensaje;

    this.props.finalizadoEn = fecha;

    this.props.canceladoEn = null;

    this.props.duracionMs = this.calculateDuration(fecha);

    this.touch(fecha);
  }

  /**
   * Exige que la operación esté en un estado concreto.
   */
  private assertCurrentState(
    expected: EstadoOperacionPppoe,
    message: string,
  ): void {
    if (this.props.estado !== expected) {
      throw new Error(`${message} Estado actual: ${this.props.estado}.`);
    }
  }

  /**
   * Verifica que una acción no ocurra antes de creadoEn.
   */
  private assertDateNotBeforeCreation(fecha: Date): void {
    if (fecha.getTime() < this.props.creadoEn.getTime()) {
      throw new Error(
        'La fecha de la acción no puede ser anterior a creadoEn.',
      );
    }
  }

  /**
   * Verifica que una finalización no ocurra antes de iniciadoEn.
   */
  private assertDateNotBeforeStart(fecha: Date): void {
    if (!this.props.iniciadoEn) {
      throw new Error('La operación no contiene iniciadoEn.');
    }

    if (fecha.getTime() < this.props.iniciadoEn.getTime()) {
      throw new Error(
        'La fecha de finalización no puede ser anterior a iniciadoEn.',
      );
    }
  }

  /**
   * Calcula la duración completa de la operación.
   */
  private calculateDuration(finalizadoEn: Date): number {
    if (!this.props.iniciadoEn) {
      throw new Error('No puede calcularse la duración sin iniciadoEn.');
    }

    const duracion = finalizadoEn.getTime() - this.props.iniciadoEn.getTime();

    if (duracion < 0) {
      throw new Error('La duración calculada no puede ser negativa.');
    }

    return duracion;
  }

  /**
   * Actualiza la fecha interna de modificación.
   */
  private touch(fecha: Date): void {
    this.props.actualizadoEn = new Date(fecha.getTime());
  }

  /**
   * Clona una fecha opcional para no exponer referencias
   * internas mutables.
   */
  private cloneOptionalDate(value: Date | null): Date | null {
    return value ? new Date(value.getTime()) : null;
  }

  /**
   * ==========================================================
   * VALIDACIONES GENERALES
   * ==========================================================
   */

  /**
   * Reglas que no dependen del estado actual.
   */
  private static assertGeneralConsistency(props: PppoeOperacionProps): void {
    if (props.instalacionId !== null && props.desinstalacionId !== null) {
      throw new Error(
        'Una operación no puede pertenecer simultáneamente a una instalación y una desinstalación.',
      );
    }

    if (props.id !== null && props.reintentoDeId === props.id) {
      throw new Error('Una operación no puede ser reintento de sí misma.');
    }

    if (props.reintentoDeId === null && props.numeroIntento !== 1) {
      throw new Error(
        'Una operación inicial debe tener numeroIntento igual a 1.',
      );
    }

    if (props.reintentoDeId !== null && props.numeroIntento < 2) {
      throw new Error(
        'Un reintento debe tener numeroIntento mayor o igual que 2.',
      );
    }

    if (
      props.origen === OrigenOperacionPppoe.OPERADOR &&
      props.iniciadoPorId === null
    ) {
      throw new Error(
        'Una operación originada por OPERADOR debe contener iniciadoPorId.',
      );
    }

    if (props.requiereReautenticacion && props.iniciadoPorId === null) {
      throw new Error(
        'Una operación con reautenticación debe tener iniciadoPorId.',
      );
    }

    this.assertReauthenticationConsistency(props);

    this.assertProfileConsistency(props);

    this.assertRouterConsistency(props);
  }

  /**
   * Reglas del perfil utilizado por la operación.
   */
  private static assertProfileConsistency(props: PppoeOperacionProps): void {
    const tienePerfilId = props.perfilHomologacionId !== null;

    const tieneCodigoPerfil = props.codigoPerfilSnapshot !== null;

    if (tienePerfilId !== tieneCodigoPerfil) {
      throw new Error(
        'perfilHomologacionId y codigoPerfilSnapshot deben existir juntos.',
      );
    }

    if (
      props.tipo === TipoOperacionPppoe.CREAR_SECRET &&
      (!tienePerfilId || !tieneCodigoPerfil)
    ) {
      throw new Error(
        'CREAR_SECRET requiere perfilHomologacionId y codigoPerfilSnapshot.',
      );
    }
  }

  /**
   * Reglas del router y canal utilizado.
   */
  private static assertRouterConsistency(props: PppoeOperacionProps): void {
    if (
      props.canal === CanalOperacionPppoe.SSH &&
      (props.routerHostSnapshot === null || props.routerPuertoSnapshot === null)
    ) {
      throw new Error(
        'Una operación SSH requiere routerHostSnapshot y routerPuertoSnapshot.',
      );
    }
  }

  /**
   * Coherencia entre los campos de reautenticación.
   */
  private static assertReauthenticationConsistency(
    props: PppoeOperacionProps,
  ): void {
    if (!props.requiereReautenticacion) {
      if (
        props.reautenticadoPorId !== null ||
        props.reautenticacionExitosa !== null ||
        props.reautenticadoEn !== null
      ) {
        throw new Error(
          'Una operación que no requiere reautenticación no debe contener datos de reautenticación.',
        );
      }

      return;
    }

    if (props.reautenticacionExitosa === null) {
      if (props.reautenticadoPorId !== null || props.reautenticadoEn !== null) {
        throw new Error(
          'Una reautenticación no evaluada no debe contener operador ni fecha.',
        );
      }

      return;
    }

    if (props.reautenticadoPorId === null || props.reautenticadoEn === null) {
      throw new Error(
        'Una reautenticación evaluada debe contener reautenticadoPorId y reautenticadoEn.',
      );
    }
  }

  /**
   * ==========================================================
   * VALIDACIONES POR ESTADO
   * ==========================================================
   */

  /**
   * Verifica que el contenido persistido sea coherente
   * con el estado de la operación.
   */
  private static assertStateConsistency(props: PppoeOperacionProps): void {
    switch (props.estado) {
      case EstadoOperacionPppoe.PENDIENTE: {
        this.assertNotStarted(props, 'PENDIENTE');

        if (props.reautenticacionExitosa === true) {
          throw new Error(
            'Una operación con reautenticación exitosa debe estar AUTORIZADA o haber comenzado.',
          );
        }

        return;
      }

      case EstadoOperacionPppoe.AUTORIZADA: {
        this.assertNotStarted(props, 'AUTORIZADA');

        if (
          !props.requiereReautenticacion ||
          props.reautenticacionExitosa !== true ||
          props.reautenticadoPorId === null ||
          props.reautenticadoEn === null
        ) {
          throw new Error(
            'Una operación AUTORIZADA debe contener una reautenticación exitosa.',
          );
        }

        return;
      }

      case EstadoOperacionPppoe.EJECUTANDO: {
        if (props.iniciadoEn === null) {
          throw new Error('Una operación EJECUTANDO debe contener iniciadoEn.');
        }

        if (
          props.finalizadoEn !== null ||
          props.canceladoEn !== null ||
          props.duracionMs !== null
        ) {
          throw new Error(
            'Una operación EJECUTANDO no puede contener fechas finales ni duración.',
          );
        }

        if (
          props.resultado !== null ||
          props.errorCodigo !== null ||
          props.errorMensaje !== null
        ) {
          throw new Error(
            'Una operación EJECUTANDO no puede contener un resultado final.',
          );
        }

        this.assertAuthorizedWhenRequired(props);

        return;
      }

      case EstadoOperacionPppoe.EXITOSA: {
        this.assertFinishedExecution(props, 'EXITOSA');

        if (props.errorCodigo !== null || props.errorMensaje !== null) {
          throw new Error(
            'Una operación EXITOSA no puede contener datos de error.',
          );
        }

        return;
      }

      case EstadoOperacionPppoe.PARCIAL: {
        this.assertFinishedWithError(props, 'PARCIAL');

        return;
      }

      case EstadoOperacionPppoe.FALLIDA: {
        this.assertFinishedWithError(props, 'FALLIDA');

        return;
      }

      case EstadoOperacionPppoe.CANCELADA: {
        if (props.canceladoEn === null) {
          throw new Error('Una operación CANCELADA debe contener canceladoEn.');
        }

        if (!props.motivo) {
          throw new Error('Una operación CANCELADA debe contener motivo.');
        }

        if (
          props.iniciadoEn !== null ||
          props.finalizadoEn !== null ||
          props.duracionMs !== null
        ) {
          throw new Error(
            'Una operación CANCELADA no puede contener ejecución ni duración.',
          );
        }

        if (
          props.resultado !== null ||
          props.errorCodigo !== null ||
          props.errorMensaje !== null
        ) {
          throw new Error(
            'Una operación CANCELADA no puede contener un resultado técnico final.',
          );
        }

        return;
      }

      default: {
        const exhaustiveCheck: never = props.estado;

        throw new Error(
          `Estado de operación no soportado: ${exhaustiveCheck}.`,
        );
      }
    }
  }

  /**
   * Valida estados previos a la ejecución.
   */
  private static assertNotStarted(
    props: PppoeOperacionProps,
    estado: 'PENDIENTE' | 'AUTORIZADA',
  ): void {
    if (
      props.iniciadoEn !== null ||
      props.finalizadoEn !== null ||
      props.canceladoEn !== null ||
      props.duracionMs !== null
    ) {
      throw new Error(
        `Una operación ${estado} no puede contener fechas de ejecución ni duración.`,
      );
    }

    if (
      props.resultado !== null ||
      props.errorCodigo !== null ||
      props.errorMensaje !== null
    ) {
      throw new Error(
        `Una operación ${estado} no puede contener resultados finales.`,
      );
    }
  }

  /**
   * Valida los campos comunes de una operación terminada.
   */
  private static assertFinishedExecution(
    props: PppoeOperacionProps,
    estado: 'EXITOSA' | 'PARCIAL' | 'FALLIDA',
  ): void {
    if (
      props.iniciadoEn === null ||
      props.finalizadoEn === null ||
      props.duracionMs === null
    ) {
      throw new Error(
        `Una operación ${estado} debe contener iniciadoEn, finalizadoEn y duracionMs.`,
      );
    }

    if (props.canceladoEn !== null) {
      throw new Error(`Una operación ${estado} no puede contener canceladoEn.`);
    }

    this.assertAuthorizedWhenRequired(props);
  }

  /**
   * Valida una finalización con error.
   */
  private static assertFinishedWithError(
    props: PppoeOperacionProps,
    estado: 'PARCIAL' | 'FALLIDA',
  ): void {
    this.assertFinishedExecution(props, estado);

    if (!props.errorCodigo || !props.errorMensaje) {
      throw new Error(
        `Una operación ${estado} debe contener errorCodigo y errorMensaje.`,
      );
    }
  }

  /**
   * Comprueba que las operaciones protegidas hayan sido
   * autorizadas antes de ejecutarse.
   */
  private static assertAuthorizedWhenRequired(
    props: PppoeOperacionProps,
  ): void {
    if (
      props.requiereReautenticacion &&
      (props.reautenticacionExitosa !== true ||
        props.reautenticadoPorId === null ||
        props.reautenticadoEn === null)
    ) {
      throw new Error(
        'La operación requería reautenticación y no contiene una autorización válida.',
      );
    }
  }

  /**
   * ==========================================================
   * VALIDACIONES TEMPORALES
   * ==========================================================
   */

  /**
   * Valida la cronología de una operación restaurada.
   */
  private static assertTemporalConsistency(props: PppoeOperacionProps): void {
    if (props.actualizadoEn.getTime() < props.creadoEn.getTime()) {
      throw new Error('actualizadoEn no puede ser anterior a creadoEn.');
    }

    const optionalDates: Array<{
      field: string;
      value: Date | null;
    }> = [
      {
        field: 'reautenticadoEn',
        value: props.reautenticadoEn,
      },
      {
        field: 'iniciadoEn',
        value: props.iniciadoEn,
      },
      {
        field: 'finalizadoEn',
        value: props.finalizadoEn,
      },
      {
        field: 'canceladoEn',
        value: props.canceladoEn,
      },
    ];

    for (const date of optionalDates) {
      if (date.value && date.value.getTime() < props.creadoEn.getTime()) {
        throw new Error(`${date.field} no puede ser anterior a creadoEn.`);
      }
    }

    if (
      props.reautenticadoEn &&
      props.iniciadoEn &&
      props.iniciadoEn.getTime() < props.reautenticadoEn.getTime()
    ) {
      throw new Error('iniciadoEn no puede ser anterior a reautenticadoEn.');
    }

    if (
      props.iniciadoEn &&
      props.finalizadoEn &&
      props.finalizadoEn.getTime() < props.iniciadoEn.getTime()
    ) {
      throw new Error('finalizadoEn no puede ser anterior a iniciadoEn.');
    }
  }

  /**
   * ==========================================================
   * NORMALIZADORES
   * ==========================================================
   */

  private static normalizePositiveInteger(
    value: number,
    field: string,
  ): number {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un entero positivo.`);
    }

    return value;
  }

  private static normalizeOptionalPositiveInteger(
    value: number | null,
    field: string,
  ): number | null {
    if (value === null) {
      return null;
    }

    return this.normalizePositiveInteger(value, field);
  }

  private static normalizeNetworkPort(value: number, field: string): number {
    if (!Number.isInteger(value) || value < 1 || value > 65_535) {
      throw new Error(`${field} debe ser un puerto válido entre 1 y 65535.`);
    }

    return value;
  }

  private static normalizeOptionalNetworkPort(
    value: number | null,
    field: string,
  ): number | null {
    if (value === null) {
      return null;
    }

    return this.normalizeNetworkPort(value, field);
  }

  private static normalizeRequiredString(
    value: string,
    field: string,
    maxLength: number,
  ): string {
    const normalized = value?.trim();

    if (!normalized) {
      throw new Error(`${field} es obligatorio.`);
    }

    if (normalized.length > maxLength) {
      throw new Error(`${field} no puede superar ${maxLength} caracteres.`);
    }

    return normalized;
  }

  private static normalizeOptionalString(
    value: string | null,
    field: string,
    maxLength: number,
  ): string | null {
    if (value === null) {
      return null;
    }

    const normalized = value.trim();

    if (!normalized) {
      return null;
    }

    if (normalized.length > maxLength) {
      throw new Error(`${field} no puede superar ${maxLength} caracteres.`);
    }

    return normalized;
  }

  private static normalizeErrorCode(value: string | null): string | null {
    if (value === null) {
      return null;
    }

    const normalized = value.trim().toUpperCase();

    if (!normalized) {
      return null;
    }

    if (normalized.length > this.MAX_ERROR_CODIGO_LENGTH) {
      throw new Error(
        `errorCodigo no puede superar ${this.MAX_ERROR_CODIGO_LENGTH} caracteres.`,
      );
    }

    if (!/^[A-Z0-9_.:-]+$/.test(normalized)) {
      throw new Error('errorCodigo contiene caracteres no permitidos.');
    }

    return normalized;
  }

  private static normalizeRequiredErrorCode(value: string): string {
    const normalized = this.normalizeErrorCode(value);

    if (!normalized) {
      throw new Error('errorCodigo es obligatorio.');
    }

    return normalized;
  }

  private static normalizeRequiredDate(value: Date, field: string): Date {
    const normalized = new Date(value);

    if (Number.isNaN(normalized.getTime())) {
      throw new Error(`${field} debe contener una fecha válida.`);
    }

    return normalized;
  }

  private static normalizeOptionalDate(
    value: Date | null,
    field: string,
  ): Date | null {
    if (value === null) {
      return null;
    }

    return this.normalizeRequiredDate(value, field);
  }

  private static normalizeActionDate(
    value: Date | undefined,
    field: string,
  ): Date {
    return this.normalizeRequiredDate(value ?? new Date(), field);
  }

  private static normalizeOptionalDuration(
    value: number | null,
  ): number | null {
    if (value === null) {
      return null;
    }

    if (!Number.isInteger(value) || value < 0) {
      throw new Error('duracionMs debe ser un entero mayor o igual que cero.');
    }

    return value;
  }

  private static normalizeEnumValue<TEnum extends Record<string, string>>(
    value: string,
    enumObject: TEnum,
    field: string,
  ): TEnum[keyof TEnum] {
    const values = Object.values(enumObject) as Array<TEnum[keyof TEnum]>;

    if (!values.includes(value as TEnum[keyof TEnum])) {
      throw new Error(`${field} contiene un valor no soportado: ${value}.`);
    }

    return value as TEnum[keyof TEnum];
  }

  /**
   * ==========================================================
   * RESULTADO JSON SANITIZADO
   * ==========================================================
   */

  /**
   * Valida, limita y clona el resultado general.
   */
  private static normalizeResult(
    value: PppoeOperacionResultado | null,
  ): PppoeOperacionResultado | null {
    if (value === null) {
      return null;
    }

    this.assertSafeResultValue(value, 'resultado');

    const serialized = JSON.stringify(value);

    if (serialized.length > this.MAX_RESULTADO_LENGTH) {
      throw new Error(
        `resultado no puede superar ${this.MAX_RESULTADO_LENGTH} caracteres serializados.`,
      );
    }

    return JSON.parse(serialized) as PppoeOperacionResultado;
  }

  /**
   * Recorre el JSON y bloquea claves sensibles.
   */
  private static assertSafeResultValue(value: unknown, path: string): void {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'boolean'
    ) {
      return;
    }

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        throw new Error(`${path} contiene un número no válido.`);
      }

      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        this.assertSafeResultValue(item, `${path}[${index}]`);
      });

      return;
    }

    if (
      typeof value !== 'object' ||
      Object.getPrototypeOf(value) !== Object.prototype
    ) {
      throw new Error(`${path} debe contener únicamente valores JSON válidos.`);
    }

    for (const [key, childValue] of Object.entries(value)) {
      const normalizedKey = this.normalizeResultKey(key);

      if (this.SENSITIVE_RESULT_KEYS.has(normalizedKey)) {
        throw new Error(
          `${path}.${key} contiene una clave sensible que no puede persistirse.`,
        );
      }

      this.assertSafeResultValue(childValue, `${path}.${key}`);
    }
  }

  /**
   * Normaliza una clave JSON para compararla
   * contra la lista de datos sensibles.
   */
  private static normalizeResultKey(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }

  /**
   * Crea una copia profunda del resultado.
   */
  private static cloneResult(
    value: PppoeOperacionResultado | null,
  ): PppoeOperacionResultado | null {
    if (value === null) {
      return null;
    }

    return JSON.parse(JSON.stringify(value)) as PppoeOperacionResultado;
  }
}
