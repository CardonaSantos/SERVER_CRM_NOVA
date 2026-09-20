import { Injectable } from '@nestjs/common';
import {
  CodigoErrorMikrotikSsh,
  EfectoRemotoMikrotik,
  FaseFalloMikrotikSsh,
} from '../../domain/enums/mikrotik-ssh.enums';
import { MikrotikSshError } from '../../domain/errors/mikrotik-ssh.error';

export type EscaparValorRouterOsOptions = {
  campo: string;

  maxBytes: number;

  permitirVacio?: boolean;

  /**
   * Recomendado para nombres de usuario y perfiles.
   *
   * Evita almacenar accidentalmente identificadores
   * con espacios al inicio o al final.
   */
  rechazarEspaciosExternos?: boolean;
};

/**
 * Escapa valores utilizados dentro de cadenas RouterOS.
 *
 * No construye comandos completos.
 */
@Injectable()
export class RouterOsValueEscaper {
  escaparCadena(value: string, options: EscaparValorRouterOsOptions): string {
    this.validateValue(value, options);

    let escaped = '';

    for (const character of value) {
      switch (character) {
        case '\\':
          escaped += '\\\\';
          break;

        case '"':
          escaped += '\\"';
          break;

        case '$':
          escaped += '\\$';
          break;

        default:
          escaped += character;
      }
    }

    return `"${escaped}"`;
  }

  private validateValue(
    value: string,
    options: EscaparValorRouterOsOptions,
  ): void {
    if (typeof value !== 'string') {
      this.throwConfigurationError(`${options.campo} debe ser un texto.`);
    }

    if (!options.permitirVacio && value.length === 0) {
      this.throwConfigurationError(`${options.campo} es obligatorio.`);
    }

    if (options.rechazarEspaciosExternos && value !== value.trim()) {
      this.throwConfigurationError(
        `${options.campo} no puede contener espacios al inicio o al final.`,
      );
    }

    /**
     * No permitimos caracteres de control ni separadores
     * de línea, aunque RouterOS tenga secuencias para algunos.
     */
    const containsControlCharacters =
      /[\u0000-\u001F\u007F-\u009F\u2028\u2029]/u.test(value);

    if (containsControlCharacters) {
      this.throwConfigurationError(
        `${options.campo} contiene caracteres de control no permitidos.`,
      );
    }

    /**
     * Detecta secuencias Unicode inválidas como
     * sustituciones producidas por surrogates incompletos.
     */
    const utf8RoundTrip = Buffer.from(value, 'utf8').toString('utf8');

    if (utf8RoundTrip !== value) {
      this.throwConfigurationError(
        `${options.campo} contiene una secuencia Unicode inválida.`,
      );
    }

    const byteLength = Buffer.byteLength(value, 'utf8');

    if (byteLength > options.maxBytes) {
      this.throwConfigurationError(
        `${options.campo} supera el límite de ${options.maxBytes} bytes.`,
      );
    }
  }

  private throwConfigurationError(message: string): never {
    throw new MikrotikSshError(message, {
      codigo: CodigoErrorMikrotikSsh.CONFIGURACION_INVALIDA,

      fase: FaseFalloMikrotikSsh.CONFIGURACION,

      efectoRemoto: EfectoRemotoMikrotik.NO_INICIADO,

      reintentable: false,
    });
  }
}
