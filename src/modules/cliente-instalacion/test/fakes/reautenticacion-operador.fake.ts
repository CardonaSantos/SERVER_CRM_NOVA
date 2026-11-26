import { UnauthorizedException } from '@nestjs/common';
import { ReautenticacionOperadorPort } from '../../application/ports/reautenticacion-operador.port';

/** Acepta cualquier contraseña salvo que `rechazar` esté activo. */
export class ReautenticacionOperadorFake
  implements ReautenticacionOperadorPort
{
  readonly confirmaciones: number[] = [];
  rechazar = false;

  confirmar(usuarioId: number): Promise<void> {
    if (this.rechazar) {
      return Promise.reject(
        new UnauthorizedException(
          'No se pudo confirmar la identidad del usuario.',
        ),
      );
    }

    this.confirmaciones.push(usuarioId);

    return Promise.resolve();
  }
}
