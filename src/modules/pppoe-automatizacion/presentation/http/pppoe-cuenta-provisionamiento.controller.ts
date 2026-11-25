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

import { PppoeCuentaProvisionamientoAdminService } from '../../application/services/pppoe-cuenta-provisionamiento-admin.service';
import { CrearPrealtaPppoeClienteManualDto } from '../dto/crear-prealta-pppoe-cliente-manual.dto';
import { ProvisionarPppoeClienteManualDto } from '../dto/provisionar-pppoe-cliente-manual.dto';
import { PppoeCuentaPresenter } from '../presenters/pppoe-cuenta.presenter';

/** Alta PPPoE de clientes existentes, fuera del flujo de instalación. */
@Controller('pppoe-cuentas')
export class PppoeCuentaProvisionamientoController {
  constructor(
    private readonly provisionamientoAdmin: PppoeCuentaProvisionamientoAdminService,
  ) {}

  /** Crea o recupera el acceso y la cuenta PPPoE; todavía no toca el router. */
  @Post('prealta')
  @Roles(...ROLES_OFICINA)
  @HttpCode(HttpStatus.OK)
  async crearPrealta(
    @Body() dto: CrearPrealtaPppoeClienteManualDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.provisionamientoAdmin.crearPrealta({
      empresaId: actor.empresaId,
      clienteId: dto.clienteId,
      servicioInternetId: dto.servicioInternetId,
      mikrotikRouterId: dto.mikrotikRouterId,
      actor: operador(actor),
    });
    return PppoeCuentaPresenter.prealta(resultado);
  }

  /** Primera activación en el router de una cuenta creada por alta manual. */
  @Post(':cuentaPppoeId/provisionar')
  @Roles(...ROLES_OFICINA)
  @OperacionSensible()
  @HttpCode(HttpStatus.OK)
  async provisionar(
    @Param('cuentaPppoeId', ParseIntPipe) cuentaPppoeId: number,
    @Body() dto: ProvisionarPppoeClienteManualDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.provisionamientoAdmin.provisionar({
      empresaId: actor.empresaId,
      cuentaPppoeId,
      // Sin trim: es una contraseña.
      contrasenaActual: dto.contrasenaActual,
      motivo: dto.motivo?.trim() || null,
      actor: operador(actor),
    });
    return PppoeCuentaPresenter.provisionamiento(resultado);
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
