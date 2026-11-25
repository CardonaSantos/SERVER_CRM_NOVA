import {
  ArgumentMetadata,
  Injectable,
  Logger,
  PipeTransform,
  ValidationPipe,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

import {
  aplanarErroresValidacion,
  ErrorValidacionHttp,
} from './error-validacion';

export type ModoValidacion = 'observacion' | 'estricto';

const INTERVALO_RESUMEN_MS = 10 * 60 * 1000;
const PRIMITIVOS: unknown[] = [String, Number, Boolean, Array, Object];
const MAX_CAMPOS_LOG = 15;

/**
 * ValidationPipe global, mismo esquema que el guard global:
 *
 * - 'estricto' (por omisión desde la etapa 8, decisión del dueño):
 *   transform + whitelist + forbidNonWhitelisted. Un campo no declarado en
 *   el DTO responde 400 en vez de perderse en silencio.
 *   SIN conversión implícita (decisión del dueño, se aparta de la guía):
 *   enableImplicitConversion rompía en silencio las @Transform existentes
 *   ("false" llegaba como true) y convertía "" en 0. Las conversiones van
 *   explícitas en cada DTO con @Type / @Transform.
 * - 'observacion' (solo con VALIDACION_MODO=observacion): no transforma ni
 *   rechaza; registra qué haría el modo estricto (solo nombres de campo y
 *   regla, nunca valores; deduplicado por DTO).
 *
 * Las rutas con ValidationPipe propio lo aplican después de este.
 */
@Injectable()
export class ValidacionGlobalPipe implements PipeTransform {
  private readonly logger = new Logger('ValidacionGlobal');

  readonly modo: ModoValidacion =
    process.env.VALIDACION_MODO === 'observacion' ? 'observacion' : 'estricto';

  private readonly estricto = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    // Errores agrupados por campo para el contrato único (estándar §7.5).
    exceptionFactory: (errores: ValidationError[]) =>
      new ErrorValidacionHttp(aplanarErroresValidacion(errores)),
  });

  private readonly vistos = new Map<
    string,
    { cuenta: number; ultimoLog: number }
  >();

  constructor() {
    this.logger.log(
      this.modo === 'estricto'
        ? 'ValidationPipe global en modo ESTRICTO (transform + whitelist + forbidNonWhitelisted).'
        : 'ValidationPipe global en modo OBSERVACIÓN: registra, no transforma ni rechaza.',
    );
  }

  async transform(value: unknown, metadata: ArgumentMetadata) {
    if (this.modo === 'estricto') {
      return this.estricto.transform(value, metadata);
    }

    try {
      await this.observar(value, metadata);
    } catch {
      // La observación nunca debe afectar la petición.
    }

    return value;
  }

  private async observar(value: unknown, metadata: ArgumentMetadata) {
    const { type, metatype, data } = metadata;

    if (
      (type !== 'body' && type !== 'query') ||
      data ||
      !metatype ||
      PRIMITIVOS.includes(metatype) ||
      value === null ||
      typeof value !== 'object'
    ) {
      return;
    }

    // Misma conversión que el modo estricto (sin conversión implícita).
    const instancia = plainToInstance(metatype, value) as object;

    const errores = await validate(instancia, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errores.length === 0) return;

    const borraria: string[] = [];
    const fallaria: string[] = [];
    this.aplanar(errores, '', borraria, fallaria);

    const resumen = [
      borraria.length
        ? `whitelist borraría [${this.recortar(borraria)}]`
        : null,
      fallaria.length ? `fallaría [${this.recortar(fallaria)}]` : null,
    ]
      .filter(Boolean)
      .join('; ');

    this.registrar(`${metatype.name} (${type}): ${resumen}`);
  }

  private aplanar(
    errores: ValidationError[],
    prefijo: string,
    borraria: string[],
    fallaria: string[],
  ) {
    for (const e of errores) {
      const ruta = prefijo ? `${prefijo}.${e.property}` : e.property;
      const reglas = Object.keys(e.constraints ?? {});

      if (reglas.includes('whitelistValidation')) {
        borraria.push(ruta);
      } else if (reglas.length > 0) {
        fallaria.push(`${ruta || '(objeto)'}: ${reglas.join(',')}`);
      }

      if (e.children?.length) {
        this.aplanar(e.children, ruta, borraria, fallaria);
      }
    }
  }

  private recortar(lista: string[]): string {
    const unicos = [...new Set(lista)].map((s) => s.slice(0, 80));
    return unicos.length > MAX_CAMPOS_LOG
      ? `${unicos.slice(0, MAX_CAMPOS_LOG).join(', ')}, … (+${unicos.length - MAX_CAMPOS_LOG})`
      : unicos.join(', ');
  }

  private registrar(clave: string) {
    const ahora = Date.now();
    const visto = this.vistos.get(clave);

    if (!visto) {
      this.vistos.set(clave, { cuenta: 1, ultimoLog: ahora });
      this.logger.warn(`[observación] ${clave}`);
      return;
    }

    visto.cuenta++;

    if (ahora - visto.ultimoLog >= INTERVALO_RESUMEN_MS) {
      this.logger.warn(
        `[observación] ${clave} — ${visto.cuenta} veces en los últimos ${Math.round((ahora - visto.ultimoLog) / 60000)} min`,
      );
      visto.cuenta = 0;
      visto.ultimoLog = ahora;
    }
  }
}
