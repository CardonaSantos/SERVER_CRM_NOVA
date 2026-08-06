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

import { PppoeOperacionAdminService } from '../application/services/pppoe-operacion-admin.service';

import { SuspenderPppoeManualDto } from './dto/suspender-pppoe-manual.dto';
import { ReactivarPppoeManualDto } from './dto/reactivar-pppoe-manual.dto';

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

@UseGuards(JwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('pppoe-cuentas')
export class PppoeCuentaAccionesController {
  constructor(private readonly adminService: PppoeOperacionAdminService) {}

  /**
   * Suspende manualmente una cuenta PPPoE concreta.
   *
   * Esta acción:
   *
   * - crea una PppoeOperacion SUSPENDER_SERVICIO;
   * - deshabilita el secret;
   * - remueve sesiones activas;
   * - confirma el estado remoto;
   * - marca la cuenta como SUSPENDIDA;
   * - marca el acceso como SUSPENDIDO;
   * - registra al operador autenticado y el motivo.
   *
   * No modifica:
   *
   * - ClienteInternet.estadoCliente;
   * - ClienteInternet.estadoCobranza;
   * - la instalación que originó el acceso.
   */
  @Post(':cuentaPppoeId/suspender')
  @HttpCode(HttpStatus.OK)
  suspender(
    @Param('cuentaPppoeId', ParseIntPipe)
    cuentaPppoeId: number,

    @Body()
    dto: SuspenderPppoeManualDto,

    @Req()
    req: AuthenticatedRequest,
  ) {
    const contexto = this.getAuthenticatedContext(req);

    return this.adminService.suspenderManual({
      empresaId: contexto.empresaId,

      cuentaPppoeId,

      claveIdempotencia: dto.claveIdempotencia.trim(),

      motivo: dto.motivo.trim(),
      contrasenaActual: dto.contrasenaActual,
      actor: {
        operadorId: contexto.actor.operadorId,

        operadorNombre: contexto.actor.operadorNombre,

        ipOrigen: contexto.actor.ipOrigen,

        userAgent: contexto.actor.userAgent,
      },
    });
  }

  /**
   * Reactiva manualmente una cuenta PPPoE suspendida.
   *
   * Esta acción:
   *
   * - crea una PppoeOperacion ACTIVAR_SECRET;
   * - habilita el secret o confirma que ya está habilitado;
   * - confirma el estado remoto;
   * - marca la cuenta como ACTIVA;
   * - marca el acceso como ACTIVO;
   * - registra al operador autenticado y el motivo.
   *
   * No modifica:
   *
   * - ClienteInternet.estadoCliente;
   * - ClienteInternet.estadoCobranza;
   * - la instalación que originó el acceso.
   */
  @Post(':cuentaPppoeId/reactivar')
  @HttpCode(HttpStatus.OK)
  reactivar(
    @Param('cuentaPppoeId', ParseIntPipe)
    cuentaPppoeId: number,

    @Body()
    dto: ReactivarPppoeManualDto,

    @Req()
    req: AuthenticatedRequest,
  ) {
    const contexto = this.getAuthenticatedContext(req);

    return this.adminService.reactivarManual({
      empresaId: contexto.empresaId,

      cuentaPppoeId,

      claveIdempotencia: dto.claveIdempotencia,

      motivo: dto.motivo,
      contrasenaActual: dto.contrasenaActual,

      actor: {
        operadorId: contexto.actor.operadorId,

        ipOrigen: contexto.actor.ipOrigen,

        userAgent: contexto.actor.userAgent,
      },
    });
  }

  /**
   * Obtiene la empresa y el operador exclusivamente
   * del JWT validado por JwtAuthGuard.
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
   * Resuelve la IP considerando proxies reversos.
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
