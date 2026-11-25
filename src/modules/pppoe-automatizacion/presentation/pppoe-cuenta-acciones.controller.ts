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
} from '@nestjs/common';

import type { Request } from 'express';

import { OperacionSensible } from 'src/auth/step-up/operacion-sensible.decorator';

import { PppoeOperacionAdminService } from '../application/services/pppoe-operacion-admin.service';

import { SuspenderPppoeManualDto } from './dto/suspender-pppoe-manual.dto';
import { ReactivarPppoeManualDto } from './dto/reactivar-pppoe-manual.dto';
import { DarDeBajaPppoeManualDto } from './dto/dar-de-baja-pppoe-manual.dto';

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

@Controller('pppoe-cuentas')
export class PppoeCuentaAccionesController {
  constructor(private readonly adminService: PppoeOperacionAdminService) {}

  /**
   * Suspende manualmente una cuenta PPPoE concreta.
   *
   * Esta acción:
   *
   * - marca la cuenta PPPoE como SUSPENDIDA;
   * - marca el acceso como SUSPENDIDO;
   * - sincroniza ClienteInternet.estadoCliente = SUSPENDIDO;
   * - registra el cambio en ClienteEstadoHistorial;
   * - registra al operador autenticado y el motivo.
   *
   * No modifica:
   *
   * - ClienteInternet.estadoCobranza;
   * - la instalación que originó el acceso.
   *
   */
  @Post(':cuentaPppoeId/suspender')
  @OperacionSensible()
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
   * - marca la cuenta PPPoE como ACTIVA;
   * - marca el acceso como ACTIVO;
   * - sincroniza ClienteInternet.estadoCliente = ACTIVO;
   * - registra el cambio en ClienteEstadoHistorial;
   * - registra al operador autenticado y el motivo.
   *
   * No modifica:
   *
   * - ClienteInternet.estadoCobranza;
   * - la instalación que originó el acceso.
   */
  @Post(':cuentaPppoeId/reactivar')
  @OperacionSensible()
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
   * Da de baja definitivamente una cuenta PPPoE.
   *
   * Esta acción NO crea una ClienteDesinstalacion.
   *
   * El operador debe reautenticarse antes de que
   * el motor PPPoE ejecute cualquier cambio remoto.
   *
   * Cuando la operación concluye correctamente:
   *
   * - se elimina el secret del MikroTik;
   * - se remueven sesiones PPPoE activas;
   * - se confirma la ausencia del secret;
   * - ClientePppoeCuenta termina ELIMINADA;
   * - ClienteAccesoInternet termina BAJA.
   *
   * La empresa y el operador se obtienen únicamente
   * del JWT autenticado.
   *
   * La clave de idempotencia se genera internamente
   * en la fachada administrativa.
   */
  @Post(':cuentaPppoeId/dar-de-baja')
  @OperacionSensible()
  @HttpCode(HttpStatus.OK)
  darDeBaja(
    @Param('cuentaPppoeId', ParseIntPipe)
    cuentaPppoeId: number,

    @Body()
    dto: DarDeBajaPppoeManualDto,

    @Req()
    req: AuthenticatedRequest,
  ) {
    const contexto = this.getAuthenticatedContext(req);

    return this.adminService.darDeBajaManual({
      empresaId: contexto.empresaId,

      cuentaPppoeId,

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
   * Obtiene la empresa y el operador exclusivamente
   * del JWT validado por el guard global.
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
    // IP real: req.ip con trust proxy 1 (Railway). No se lee x-forwarded-for a
    // mano: su primer valor lo puede inventar el cliente.
    return req.ip?.trim() || null;
  }
}
