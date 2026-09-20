import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';

import { PrismaService } from 'src/prisma/prisma.service';

import {
  OperadorReautenticacionPort,
  ValidarReautenticacionOperadorParams,
} from '../../../domain/ports/operador-reautenticacion.port';

/**
 * Valida nuevamente las credenciales de un operador
 * antes de autorizar una operación PPPoE sensible.
 */
@Injectable()
export class OperadorReautenticacionPrismaAdapter
  implements OperadorReautenticacionPort
{
  constructor(private readonly prisma: PrismaService) {}

  async validar(
    params: ValidarReautenticacionOperadorParams,
  ): Promise<boolean> {
    if (!this.hasValidParams(params)) {
      return false;
    }

    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: params.operadorId,

        empresaId: params.empresaId,

        activo: true,
      },

      select: {
        contrasena: true,
      },
    });

    if (!usuario?.contrasena) {
      return false;
    }

    try {
      return await bcrypt.compare(params.password, usuario.contrasena);
    } catch {
      /**
       * Un hash inválido o corrupto se trata como
       * una autenticación rechazada.
       */
      return false;
    }
  }

  /**
   * Validación defensiva.
   *
   * El caso de uso ya valida estos datos, pero el adaptador
   * también protege su contrato ante llamadas internas.
   */
  private hasValidParams(
    params: ValidarReautenticacionOperadorParams,
  ): boolean {
    return (
      Number.isInteger(params.empresaId) &&
      params.empresaId > 0 &&
      Number.isInteger(params.operadorId) &&
      params.operadorId > 0 &&
      typeof params.password === 'string' &&
      params.password.length > 0 &&
      params.password.length <= 512
    );
  }
}
