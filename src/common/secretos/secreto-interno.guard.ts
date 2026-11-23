import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { Public } from 'src/auth/decoradores/public.decorator';
import { secretoCoincide } from './comparar-secreto';

/**
 * Autenticación servidor a servidor por cabecera x-internal-secret
 * (INTERNAL_SECRET). Es un guard para que corra ANTES de los pipes: sin
 * secreto válido la respuesta es 401, sin llegar a validar el body.
 * Falla cerrado si INTERNAL_SECRET no está configurado; tiempo constante.
 */
@Injectable()
export class SecretoInternoGuard implements CanActivate {
  private readonly logger = new Logger(SecretoInternoGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const esperado = this.config.get<string>('INTERNAL_SECRET');

    if (!esperado) {
      this.logger.error(
        'INTERNAL_SECRET no está configurado: petición rechazada.',
      );
    }

    const recibido = context.switchToHttp().getRequest<Request>().headers[
      'x-internal-secret'
    ];

    if (!secretoCoincide(recibido, esperado)) {
      throw new UnauthorizedException('TOKEN NO AUTORIZADO');
    }

    return true;
  }
}

/** Endpoint público para JWT pero protegido por x-internal-secret. */
export const RequiereSecretoInterno = () =>
  applyDecorators(Public(), UseGuards(SecretoInternoGuard));
