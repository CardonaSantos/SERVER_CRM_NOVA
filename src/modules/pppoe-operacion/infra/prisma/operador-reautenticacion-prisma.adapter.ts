import { Injectable } from '@nestjs/common';

import { PasswordService } from 'src/auth/password/password.service';
import { stepUpVigentePara } from 'src/auth/step-up/contexto-reautenticacion';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  OperadorReautenticacionPort,
  ValidarReautenticacionOperadorParams,
} from '../../application/ports/operador-reautenticacion.port';

/**
 * Valida nuevamente las credenciales de un operador
 * antes de autorizar una operación PPPoE sensible.
 */
@Injectable()
export class OperadorReautenticacionPrismaAdapter
  implements OperadorReautenticacionPort
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async validar(
    params: ValidarReautenticacionOperadorParams,
  ): Promise<boolean> {
    if (!this.hasValidParams(params)) {
      return false;
    }

    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: params.operadorId,
        activo: true,
      },
      select: {
        contrasena: true,
      },
    });

    if (!usuario?.contrasena) {
      return false;
    }

    /**
     * Step-up vigente del mismo operador (D8, transición): el usuario ya
     * confirmó su contraseña en POST /auth/reautenticar. Sigue exigiéndose
     * que exista, esté activo (consulta de arriba).
     */
    if (stepUpVigentePara(params.operadorId)) {
      return true;
    }

    /**
     * scrypt o bcrypt heredado. Un hash inválido o corrupto se trata
     * como una autenticación rechazada (verify nunca lanza).
     */
    return this.passwordService.verify(params.password, usuario.contrasena);
  }

  private hasValidParams(
    params: ValidarReautenticacionOperadorParams,
  ): boolean {
    return (
      Number.isInteger(params.operadorId) &&
      params.operadorId > 0 &&
      typeof params.password === 'string' &&
      params.password.length > 0 &&
      params.password.length <= 512
    );
  }
}
