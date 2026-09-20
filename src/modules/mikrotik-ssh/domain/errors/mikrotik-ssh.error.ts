import {
  CodigoErrorMikrotikSsh,
  EfectoRemotoMikrotik,
  FaseFalloMikrotikSsh,
} from '../enums/mikrotik-ssh.enums';

/**
 * Datos necesarios para construir un error SSH normalizado.
 */
export type MikrotikSshErrorProps = {
  codigo: CodigoErrorMikrotikSsh;

  fase: FaseFalloMikrotikSsh;

  efectoRemoto: EfectoRemotoMikrotik;

  reintentable: boolean;

  duracionMs?: number;

  /**
   * Error original de ssh2, Node.js o sockets.
   *
   * Solo se conserva en memoria y no se incluye
   * en los primitivos seguros.
   */
  cause?: unknown;
};

/**
 * Representación segura para operaciones, auditorías y logs.
 */
export type MikrotikSshErrorPrimitives = {
  nombre: 'MikrotikSshError';

  codigo: CodigoErrorMikrotikSsh;

  mensaje: string;

  fase: FaseFalloMikrotikSsh;

  efectoRemoto: EfectoRemotoMikrotik;

  reintentable: boolean;

  duracionMs: number;
};

/**
 * Error técnico normalizado del módulo mikrotik-ssh.
 *
 * Evita exponer directamente errores de:
 *
 * - ssh2;
 * - sockets;
 * - DNS;
 * - streams;
 * - RouterOS.
 */
export class MikrotikSshError extends Error {
  private static readonly MAX_MESSAGE_LENGTH = 2_000;

  readonly codigo: CodigoErrorMikrotikSsh;

  readonly fase: FaseFalloMikrotikSsh;

  readonly efectoRemoto: EfectoRemotoMikrotik;

  readonly reintentable: boolean;

  readonly duracionMs: number;

  /**
   * Se conserva como propiedad no enumerable para evitar
   * que se serialice accidentalmente.
   */
  readonly cause?: unknown;

  constructor(message: string, props: MikrotikSshErrorProps) {
    super(MikrotikSshError.normalizeMessage(message));

    this.name = 'MikrotikSshError';

    this.codigo = MikrotikSshError.assertEnumValue(
      props.codigo,
      CodigoErrorMikrotikSsh,
      'codigo',
    );

    this.fase = MikrotikSshError.assertEnumValue(
      props.fase,
      FaseFalloMikrotikSsh,
      'fase',
    );

    this.efectoRemoto = MikrotikSshError.assertEnumValue(
      props.efectoRemoto,
      EfectoRemotoMikrotik,
      'efectoRemoto',
    );

    this.reintentable = MikrotikSshError.normalizeBoolean(
      props.reintentable,
      'reintentable',
    );

    this.duracionMs = MikrotikSshError.normalizeDuration(props.duracionMs ?? 0);

    Object.defineProperty(this, 'cause', {
      value: props.cause,
      enumerable: false,
      configurable: false,
      writable: false,
    });

    Object.setPrototypeOf(this, MikrotikSshError.prototype);

    Error.captureStackTrace?.(this, MikrotikSshError);
  }

  /**
   * Comprueba si un valor es un error normalizado
   * del módulo SSH.
   */
  static is(value: unknown): value is MikrotikSshError {
    return value instanceof MikrotikSshError;
  }

  /**
   * Indica si la operación puede ejecutarse nuevamente.
   */
  puedeReintentarse(): boolean {
    return this.reintentable;
  }

  /**
   * Indica que el router pudo haber sido modificado,
   * pero el resultado no fue confirmado.
   */
  pudoModificarRouter(): boolean {
    return this.efectoRemoto === EfectoRemotoMikrotik.POSIBLE;
  }

  /**
   * Indica que una consulta posterior confirmó
   * el efecto remoto.
   */
  tieneEfectoConfirmado(): boolean {
    return this.efectoRemoto === EfectoRemotoMikrotik.CONFIRMADO;
  }

  /**
   * Indica que el comando modificador no comenzó.
   */
  noInicioEfectoRemoto(): boolean {
    return this.efectoRemoto === EfectoRemotoMikrotik.NO_INICIADO;
  }

  /**
   * Devuelve únicamente información segura.
   *
   * No incluye:
   *
   * - stack;
   * - cause;
   * - credenciales;
   * - comandos;
   * - stdout;
   * - stderr.
   */
  toPrimitives(): MikrotikSshErrorPrimitives {
    return {
      nombre: 'MikrotikSshError',

      codigo: this.codigo,

      mensaje: this.message,

      fase: this.fase,

      efectoRemoto: this.efectoRemoto,

      reintentable: this.reintentable,

      duracionMs: this.duracionMs,
    };
  }

  /**
   * Información apta para registrar en un paso
   * o en una operación PPPoE.
   */
  toOperationError(): {
    errorCodigo: string;
    errorMensaje: string;
  } {
    return {
      errorCodigo: this.codigo,

      errorMensaje: this.message,
    };
  }

  private static normalizeMessage(value: string): string {
    if (typeof value !== 'string') {
      throw new Error('El mensaje del error SSH debe ser un texto.');
    }

    const normalized = value.trim();

    if (!normalized) {
      throw new Error('El mensaje del error SSH es obligatorio.');
    }

    if (normalized.length > this.MAX_MESSAGE_LENGTH) {
      return normalized.slice(0, this.MAX_MESSAGE_LENGTH);
    }

    return normalized;
  }

  private static normalizeDuration(value: number): number {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error('duracionMs debe ser un número mayor o igual que cero.');
    }

    return Math.round(value);
  }

  private static normalizeBoolean(value: boolean, field: string): boolean {
    if (typeof value !== 'boolean') {
      throw new Error(`${field} debe ser booleano.`);
    }

    return value;
  }

  private static assertEnumValue<TEnum extends Record<string, string>>(
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
}
