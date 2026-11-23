import {
  ArgumentMetadata,
  Injectable,
  Logger,
  PipeTransform,
  ValidationPipe,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

export type ModoValidacion = 'observacion' | 'estricto';

const INTERVALO_RESUMEN_MS = 10 * 60 * 1000;
const PRIMITIVOS: unknown[] = [String, Number, Boolean, Array, Object];
const MAX_CAMPOS_LOG = 15;

/**
 * ValidationPipe global (etapa 7), mismo esquema que el guard global:
 *
 * - 'observacion' (por omisión): NO transforma ni rechaza. Para cada
 *   @Body()/@Query() con DTO calcula qué haría el pipe estricto y lo
 *   registra: campos que `whitelist` borraría y reglas que fallarían.
 *   Solo nombres de campo y de regla, nunca valores. Deduplicado por DTO.
 *   Con ese log se corrigen los DTOs legacy antes de encenderlo.
 * - 'estricto' (VALIDACION_MODO=estricto): ValidationPipe con transform,
 *   conversión implícita de tipos y whitelist (forbidNonWhitelisted se
 *   decide módulo por módulo, no aquí). Se activa en la etapa 8.
 *
 * Las rutas que ya tienen su propio ValidationPipe siguen validando igual.
 */
@Injectable()
export class ValidacionGlobalPipe implements PipeTransform {
  private readonly logger = new Logger('ValidacionGlobal');

  readonly modo: ModoValidacion =
    process.env.VALIDACION_MODO === 'estricto' ? 'estricto' : 'observacion';

  private readonly estricto = new ValidationPipe({
    transform: true,
    whitelist: true,
    transformOptions: { enableImplicitConversion: true },
  });

  private readonly vistos = new Map<
    string,
    { cuenta: number; ultimoLog: number }
  >();

  constructor() {
    this.logger.log(
      this.modo === 'estricto'
        ? 'ValidationPipe global en modo ESTRICTO (transform + whitelist).'
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

    const instancia = plainToInstance(metatype, value, {
      enableImplicitConversion: true,
    }) as object;

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
