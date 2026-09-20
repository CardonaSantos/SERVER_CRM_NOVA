import { MikrotikSshError } from 'src/modules/mikrotik-ssh/domain/errors/mikrotik-ssh.error';

import {
  EfectoRemotoMikrotik,
  FaseFalloMikrotikSsh,
} from 'src/modules/mikrotik-ssh/domain/enums/mikrotik-ssh.enums';

export type PppoeOperacionStepErrorProps = {
  errorCodigo: string;

  errorMensaje: string;

  efectoRemoto: EfectoRemotoMikrotik;

  reintentable: boolean;

  fase: FaseFalloMikrotikSsh;

  cause?: unknown;
};

/**
 * Error seguro utilizado por la automatización PPPoE.
 *
 * Unifica:
 *
 * - errores normalizados de mikrotik-ssh;
 * - errores inesperados ocurridos durante un paso;
 * - clasificación del posible efecto remoto.
 *
 * No expone stack, stdout, stderr ni credenciales.
 */
export class PppoeOperacionStepError extends Error {
  readonly errorCodigo: string;

  readonly efectoRemoto: EfectoRemotoMikrotik;

  readonly reintentable: boolean;

  readonly fase: FaseFalloMikrotikSsh;

  readonly cause?: unknown;

  constructor(props: PppoeOperacionStepErrorProps) {
    super(props.errorMensaje);

    this.name = 'PppoeOperacionStepError';

    this.errorCodigo = props.errorCodigo;

    this.efectoRemoto = props.efectoRemoto;

    this.reintentable = props.reintentable;

    this.fase = props.fase;

    Object.defineProperty(this, 'cause', {
      value: props.cause,

      enumerable: false,

      configurable: false,

      writable: false,
    });

    Object.setPrototypeOf(this, PppoeOperacionStepError.prototype);

    Error.captureStackTrace?.(this, PppoeOperacionStepError);
  }

  /**
   * Convierte cualquier error producido durante un paso
   * en una representación segura y clasificable.
   */
  static from(error: unknown): PppoeOperacionStepError {
    if (error instanceof PppoeOperacionStepError) {
      return error;
    }

    if (MikrotikSshError.is(error)) {
      const operationError = error.toOperationError();

      return new PppoeOperacionStepError({
        errorCodigo: operationError.errorCodigo,

        errorMensaje: operationError.errorMensaje,

        efectoRemoto: error.efectoRemoto,

        reintentable: error.reintentable,

        fase: error.fase,

        cause: error,
      });
    }

    /**
     * Un error no reconocido ocurrido después de comenzar
     * el paso se trata conservadoramente como POSIBLE.
     *
     * Así evitamos repetir automáticamente una mutación
     * remota cuyo resultado no conocemos.
     */
    return new PppoeOperacionStepError({
      errorCodigo: 'ERROR_PASO_DESCONOCIDO',

      errorMensaje:
        'Ocurrió un error no controlado durante la ejecución del paso PPPoE.',

      efectoRemoto: EfectoRemotoMikrotik.POSIBLE,

      reintentable: true,

      fase: FaseFalloMikrotikSsh.EJECUCION,

      cause: error,
    });
  }

  noInicioEfectoRemoto(): boolean {
    return this.efectoRemoto === EfectoRemotoMikrotik.NO_INICIADO;
  }

  pudoModificarRouter(): boolean {
    return this.efectoRemoto === EfectoRemotoMikrotik.POSIBLE;
  }

  tieneEfectoConfirmado(): boolean {
    return this.efectoRemoto === EfectoRemotoMikrotik.CONFIRMADO;
  }

  debeFinalizarComoParcial(): boolean {
    return this.pudoModificarRouter() || this.tieneEfectoConfirmado();
  }

  toOperationError(): {
    errorCodigo: string;

    errorMensaje: string;
  } {
    return {
      errorCodigo: this.errorCodigo,

      errorMensaje: this.message,
    };
  }
}
