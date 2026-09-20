import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from 'src/auth/JwtGuard/jwt-auth.guard';

import { VerificarAdopcionPppoeUseCase } from '../application/use-cases/verificar-adopcion-pppoe.use-case';

import { AdoptarCuentaPppoeExistenteUseCase } from '../application/use-cases/adoptar-cuenta-pppoe-existente.use-case';

import {
  AdoptarCuentaPppoeExistenteDto,
  VerificarAdopcionPppoeDto,
} from './dto/adopcion-pppoe.dto';

type AuthenticatedRequest = Request & {
  user?: {
    id?: number | string;

    sub?: number | string;

    userId?: number | string;

    empresaId?: number | string;

    nombre?: string;
  };
};

type ContextoAdopcionHttp = {
  empresaId: number;

  operadorId: number;
};

/**
 * Administración de cuentas PPPoE que ya existían
 * previamente en MikroTik.
 *
 * Este flujo:
 *
 * - NO crea secrets;
 * - NO modifica passwords;
 * - NO habilita/deshabilita secrets;
 * - NO ejecuta cambios remotos.
 *
 * Solamente verifica el estado real y registra
 * localmente una cuenta preexistente.
 */
@UseGuards(JwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,

    whitelist: true,

    forbidNonWhitelisted: true,
  }),
)
@Controller('pppoe-cuentas/adopcion')
export class PppoeCuentaAdopcionController {
  constructor(
    private readonly verificarAdopcion: VerificarAdopcionPppoeUseCase,

    private readonly adoptarCuenta: AdoptarCuentaPppoeExistenteUseCase,
  ) {}

  /**
   * ========================================================
   * POST /pppoe-cuentas/adopcion/verificar
   * ========================================================
   *
   * Verificación previa e informativa.
   *
   * Comprueba:
   *
   * - que el cliente no tenga otra cuenta PPPoE;
   * - que el username no esté registrado en CRM;
   * - que la homologación exista y esté activa;
   * - que el secret exista en MikroTik;
   * - que la contraseña coincida;
   * - que el profile coincida;
   * - que service sea pppoe o any;
   * - si el secret está habilitado o suspendido.
   *
   * No persiste una cuenta.
   * No modifica MikroTik.
   */
  @Post('verificar')
  @HttpCode(HttpStatus.OK)
  verificar(
    @Body()
    dto: VerificarAdopcionPppoeDto,

    @Req()
    req: AuthenticatedRequest,
  ) {
    const contexto = this.getAuthenticatedContext(req);

    return this.verificarAdopcion.execute({
      empresaId: contexto.empresaId,

      clienteId: dto.clienteId,

      perfilHomologacionId: dto.perfilHomologacionId,

      usuarioPppoe: dto.usuarioPppoe,

      /**
       * Importante:
       *
       * la contraseña se entrega exactamente
       * como llegó en el body.
       */
      passwordPppoe: dto.passwordPppoe,
    });
  }

  /**
   * ========================================================
   * POST /pppoe-cuentas/adopcion
   * ========================================================
   *
   * Ejecuta la adopción definitiva.
   *
   * Este endpoint NO confía en una verificación
   * realizada anteriormente.
   *
   * El caso de uso:
   *
   * 1. vuelve a validar CRM;
   * 2. vuelve a verificar MikroTik;
   * 3. confirma usuario/password/profile/service;
   * 4. obtiene el estado remoto;
   * 5. cifra la misma contraseña;
   * 6. persiste acceso + cuenta + auditoría
   *    en una sola transacción.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  adoptar(
    @Body()
    dto: AdoptarCuentaPppoeExistenteDto,

    @Req()
    req: AuthenticatedRequest,
  ) {
    const contexto = this.getAuthenticatedContext(req);

    return this.adoptarCuenta.execute({
      empresaId: contexto.empresaId,

      clienteId: dto.clienteId,

      perfilHomologacionId: dto.perfilHomologacionId,

      usuarioPppoe: dto.usuarioPppoe,

      passwordPppoe: dto.passwordPppoe,

      operadorId: contexto.operadorId,
    });
  }

  /**
   * Empresa y operador solamente pueden proceder
   * del JWT validado.
   *
   * Nunca aceptamos esos identificadores desde
   * el body de la petición.
   */
  private getAuthenticatedContext(
    req: AuthenticatedRequest,
  ): ContextoAdopcionHttp {
    const rawOperadorId = req.user?.id ?? req.user?.sub ?? req.user?.userId;

    const operadorId = Number(rawOperadorId);

    const empresaId = Number(req.user?.empresaId);

    if (!Number.isInteger(operadorId) || operadorId <= 0) {
      throw new UnauthorizedException(
        'No fue posible identificar al operador autenticado.',
      );
    }

    if (!Number.isInteger(empresaId) || empresaId <= 0) {
      throw new UnauthorizedException(
        'No fue posible identificar la empresa del operador autenticado.',
      );
    }

    return {
      empresaId,

      operadorId,
    };
  }
}
