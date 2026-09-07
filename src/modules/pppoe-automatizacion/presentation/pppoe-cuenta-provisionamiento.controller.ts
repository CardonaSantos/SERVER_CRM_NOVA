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
  };
};

type ActorAdministrativoHttp = {
  operadorId: number;

  operadorNombre: string | null;

  ipOrigen: string | null;

  userAgent: string | null;
};

type ContextoAutenticadoHttp = {
  empresaId: number;

  actor: ActorAdministrativoHttp;
};

/**
 * Expone el flujo administrativo para asignar
 * y provisionar PPPoE a clientes existentes.
 *
 * Este controlador no pertenece al flujo
 * de ClienteInstalacion.
 *
 * Flujo:
 *
 * 1. POST /pppoe-cuentas/prealta
 *    Crea ClienteAccesoInternet + ClientePppoeCuenta.
 *
 * 2. POST /pppoe-cuentas/:cuentaPppoeId/provisionar
 *    Reautentica al operador y ejecuta:
 *
 *    CREAR_SECRET -> ACTIVAR_SECRET.
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
   * Esta acción:
   *
   * - crea o recupera ClienteAccesoInternet;
   * - crea ClientePppoeCuenta;
   * - asigna la homologación seleccionada;
   * - genera las credenciales PPPoE;
   * - registra auditoría;
   *
   * pero NO ejecuta comandos SSH contra MikroTik.
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

        ipOrigen: contexto.actor.ipOrigen,

        userAgent: contexto.actor.userAgent,
      },
    });
  }

  /**
   * Provisiona por primera vez una cuenta PPPoE
   * previamente creada mediante prealta administrativa.
   *
   * Esta acción:
   *
   * - reautentica al operador;
   * - crea o confirma el secret en MikroTik;
   * - ejecuta la activación formal;
   * - marca ClientePppoeCuenta como ACTIVA;
   * - marca ClienteAccesoInternet como ACTIVO.
   *
   * Si CREAR_SECRET falla, ACTIVAR_SECRET no se ejecuta.
   *
   * Las operaciones FALLIDA o PARCIAL pueden utilizar
   * posteriormente el flujo genérico de reintento PPPoE.
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

      contrasenaActual: dto.contrasenaActual,

      motivo: dto.motivo?.trim() || null,

      actor: {
        operadorId: contexto.actor.operadorId,

        operadorNombre: contexto.actor.operadorNombre,

        ipOrigen: contexto.actor.ipOrigen,

        userAgent: contexto.actor.userAgent,
      },
    });
  }

  /**
   * Obtiene empresa y operador exclusivamente
   * desde el JWT validado por JwtAuthGuard.
   */
  private getAuthenticatedContext(
    req: AuthenticatedRequest,
  ): ContextoAutenticadoHttp {
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

      actor: {
        operadorId,

        operadorNombre: req.user?.nombre?.trim() || null,

        ipOrigen: this.getClientIp(req),

        userAgent: req.headers['user-agent']?.trim() || null,
      },
    };
  }

  /**
   * Resuelve la IP real considerando proxies reversos.
   */
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
