import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { Roles } from 'src/auth/decoradores/roles.decorator';
import { ROLES_OFICINA } from 'src/auth/roles/grupos-roles';
import { OperacionSensible } from 'src/auth/step-up/operacion-sensible.decorator';

import { PppoeOperacionAdminService } from '../../application/services/pppoe-operacion-admin.service';
import { DarDeBajaPppoeManualDto } from '../dto/dar-de-baja-pppoe-manual.dto';
import { ReactivarPppoeManualDto } from '../dto/reactivar-pppoe-manual.dto';
import { SuspenderPppoeManualDto } from '../dto/suspender-pppoe-manual.dto';
import { PppoeOperacionPresenter } from '../presenters/pppoe-operacion.presenter';

/**
 * Acciones manuales sobre una cuenta PPPoE. Cambian el router y el estado
 * operativo del cliente, nunca su estado de cobranza.
 */
@Controller('pppoe-cuentas')
export class PppoeCuentaAccionesController {
  constructor(private readonly adminService: PppoeOperacionAdminService) {}

  /** Cuenta y acceso a SUSPENDIDO; el cliente queda SUSPENDIDO en su historial. */
  @Post(':cuentaPppoeId/suspender')
  @Roles(...ROLES_OFICINA)
  @OperacionSensible()
  @HttpCode(HttpStatus.OK)
  async suspender(
    @Param('cuentaPppoeId', ParseIntPipe) cuentaPppoeId: number,
    @Body() dto: SuspenderPppoeManualDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.adminService.suspenderManual({
      empresaId: actor.empresaId,
      cuentaPppoeId,
      claveIdempotencia: dto.claveIdempotencia.trim(),
      motivo: dto.motivo.trim(),
      contrasenaActual: dto.contrasenaActual,
      actor: operador(actor),
    });
    return PppoeOperacionPresenter.ejecucion(resultado);
  }

  /** Cuenta y acceso a ACTIVO; el cliente queda ACTIVO en su historial. */
  @Post(':cuentaPppoeId/reactivar')
  @Roles(...ROLES_OFICINA)
  @OperacionSensible()
  @HttpCode(HttpStatus.OK)
  async reactivar(
    @Param('cuentaPppoeId', ParseIntPipe) cuentaPppoeId: number,
    @Body() dto: ReactivarPppoeManualDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.adminService.reactivarManual({
      empresaId: actor.empresaId,
      cuentaPppoeId,
      claveIdempotencia: dto.claveIdempotencia.trim(),
      motivo: dto.motivo.trim(),
      contrasenaActual: dto.contrasenaActual,
      actor: operador(actor),
    });
    return PppoeOperacionPresenter.ejecucion(resultado);
  }

  /**
   * Baja definitiva sin desinstalación: elimina el secret y las sesiones del
   * router; la cuenta termina ELIMINADA y el acceso en BAJA.
   */
  @Post(':cuentaPppoeId/dar-de-baja')
  @Roles(...ROLES_OFICINA)
  @OperacionSensible()
  @HttpCode(HttpStatus.OK)
  async darDeBaja(
    @Param('cuentaPppoeId', ParseIntPipe) cuentaPppoeId: number,
    @Body() dto: DarDeBajaPppoeManualDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.adminService.darDeBajaManual({
      empresaId: actor.empresaId,
      cuentaPppoeId,
      motivo: dto.motivo.trim(),
      contrasenaActual: dto.contrasenaActual,
      actor: operador(actor),
    });
    return PppoeOperacionPresenter.ejecucion(resultado);
  }
}

function operador(actor: ActorHttp) {
  return {
    operadorId: actor.usuarioId,
    operadorNombre: actor.nombre.trim() || null,
    ipOrigen: actor.ip,
    userAgent: actor.userAgent,
  };
}
