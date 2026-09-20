import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from 'src/auth/JwtGuard/jwt-auth.guard';

import { PppoeCuentaProvisionamientoAdminService } from '../application/services/pppoe-cuenta-provisionamiento-admin.service';

import { CrearPrealtaPppoeClienteManualDto } from './dto/crear-prealta-pppoe-cliente-manual.dto';

import { ProvisionarPppoeClienteManualDto } from './dto/provisionar-pppoe-cliente-manual.dto';

type AuthenticatedRequest = Request & {
  user?: {
    id?: number | string;

    sub?: number | string;

    userId?: number | string;

    empresaId?: number | string;

    nombre?: string;

    /**
     * Proveniente del JWT validado.
     */
    rol?: string;
  };
};

type ActorAdministrativoHttp = {
  operadorId: number;

  operadorNombre: string | null;

  actorRol: string;

  ipOrigen: string | null;

  userAgent: string | null;
};

type ContextoAutenticadoHttp = {
  empresaId: number;

  actor: ActorAdministrativoHttp;
};

/**
 * Expone el flujo administrativo para crear
 * y provisionar PPPoE a clientes existentes
 * fuera de ClienteInstalacion.
 *
 * Seguridad:
 *
 * - empresaId: JWT;
 * - operadorId: JWT;
 * - rol: JWT;
 * - contraseña de reautenticación: body;
 * - nunca aceptamos identidad administrativa
 *   desde el payload HTTP.
 */
@UseGuards(JwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,

    whitelist: true,

    forbidNonWhitelisted: true,
  }),
)
@Controller('pppoe-cuentas')
export class PppoeCuentaProvisionamientoController {
  constructor(
    private readonly provisionamientoAdmin: PppoeCuentaProvisionamientoAdminService,
  ) {}

  /**
   * Prepara una cuenta PPPoE para un cliente existente.
   *
   * Crea/recupera:
   *
   * ClienteAccesoInternet
   *        ↓
   * ClientePppoeCuenta
   *
   * Todavía no ejecuta SSH.
   */
  @Post('prealta')
  @HttpCode(HttpStatus.OK)
  crearPrealta(
    @Body()
    dto: CrearPrealtaPppoeClienteManualDto,

    @Req()
    req: AuthenticatedRequest,
  ) {
    const contexto = this.getAuthenticatedContext(req);

    return this.provisionamientoAdmin.crearPrealta({
      empresaId: contexto.empresaId,

      clienteId: dto.clienteId,

      servicioInternetId: dto.servicioInternetId,

      mikrotikRouterId: dto.mikrotikRouterId,

      actor: {
        operadorId: contexto.actor.operadorId,

        operadorNombre: contexto.actor.operadorNombre,

        actorRol: contexto.actor.actorRol,

        ipOrigen: contexto.actor.ipOrigen,

        userAgent: contexto.actor.userAgent,
      },
    });
  }

  /**
   * Primera activación real de una cuenta
   * creada mediante ALTA_MANUAL.
   *
   * El use case volverá a comprobar además que:
   *
   * acciones.activar.flujo === ALTA_MANUAL
   *
   * antes de ejecutar cualquier operación técnica.
   */
  @Post(':cuentaPppoeId/provisionar')
  @HttpCode(HttpStatus.OK)
  provisionar(
    @Param('cuentaPppoeId', ParseIntPipe)
    cuentaPppoeId: number,

    @Body()
    dto: ProvisionarPppoeClienteManualDto,

    @Req()
    req: AuthenticatedRequest,
  ) {
    const contexto = this.getAuthenticatedContext(req);

    return this.provisionamientoAdmin.provisionar({
      empresaId: contexto.empresaId,

      cuentaPppoeId,

      /**
       * IMPORTANTE:
       *
       * no aplicar trim a contrasenaActual.
       */
      contrasenaActual: dto.contrasenaActual,

      motivo: dto.motivo?.trim() || null,

      actor: {
        operadorId: contexto.actor.operadorId,

        operadorNombre: contexto.actor.operadorNombre,

        actorRol: contexto.actor.actorRol,

        ipOrigen: contexto.actor.ipOrigen,

        userAgent: contexto.actor.userAgent,
      },
    });
  }

  /**
   * Toda la identidad administrativa se deriva
   * exclusivamente del JWT validado por JwtAuthGuard.
   */
  private getAuthenticatedContext(
    req: AuthenticatedRequest,
  ): ContextoAutenticadoHttp {
    const rawOperadorId = req.user?.id ?? req.user?.sub ?? req.user?.userId;

    const operadorId = Number(rawOperadorId);

    const empresaId = Number(req.user?.empresaId);

    const actorRol = req.user?.rol?.trim();

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

    if (!actorRol) {
      throw new UnauthorizedException(
        'No fue posible identificar el rol del operador autenticado.',
      );
    }

    return {
      empresaId,

      actor: {
        operadorId,

        operadorNombre: req.user?.nombre?.trim() || null,

        actorRol,

        ipOrigen: this.getClientIp(req),

        userAgent: req.headers['user-agent']?.trim() || null,
      },
    };
  }

  private getClientIp(req: AuthenticatedRequest): string | null {
    const forwardedFor = req.headers['x-forwarded-for'];

    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0]?.trim() || null;
    }

    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      return forwardedFor[0]?.split(',')[0]?.trim() || null;
    }

    return req.ip?.trim() || null;
  }
}
