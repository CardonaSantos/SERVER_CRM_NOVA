import {
  applyDecorators,
  CanActivate,
  GoneException,
  Injectable,
  UseGuards,
} from '@nestjs/common';

/**
 * Siempre responde 410 Gone. Al ser un guard, corre antes de pipes,
 * interceptores y handler: el código detrás no se ejecuta.
 */
@Injectable()
class EndpointRetiradoGuard implements CanActivate {
  canActivate(): boolean {
    throw new GoneException(
      'Este endpoint fue retirado por seguridad y ya no ejecuta ninguna acción.',
    );
  }
}

/**
 * Retira un endpoint peligroso (borrados masivos, importaciones masivas)
 * sin tocar su lógica: responde 410 y no borra ni importa nada. Decisión
 * del dueño, etapa 8. Para reactivarlo hay que quitar este decorador a
 * propósito, con su propio commit.
 */
export const EndpointRetirado = () =>
  applyDecorators(UseGuards(EndpointRetiradoGuard));
