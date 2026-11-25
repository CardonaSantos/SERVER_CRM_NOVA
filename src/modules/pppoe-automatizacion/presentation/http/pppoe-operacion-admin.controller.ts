import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';

import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { Roles } from 'src/auth/decoradores/roles.decorator';
import { ROLES_OFICINA } from 'src/auth/roles/grupos-roles';
import { OperacionSensible } from 'src/auth/step-up/operacion-sensible.decorator';

import { PppoeOperacionAdminService } from '../../application/services/pppoe-operacion-admin.service';
import { AutorizarPppoeOperacionDto } from '../dto/autorizar-pppoe-operacion.dto';
import { CancelarPppoeOperacionDto } from '../dto/cancelar-pppoe-operacion.dto';
import { ListarPppoeOperacionesQueryDto } from '../dto/listar-pppoe-operaciones-query.dto';
import { RecuperarPppoeOperacionDto } from '../dto/recuperar-pppoe-operacion.dto';
import { ReintentarPppoeOperacionDto } from '../dto/reintentar-pppoe-operacion.dto';
import { PppoeOperacionPresenter } from '../presenters/pppoe-operacion.presenter';

@Controller('pppoe-operaciones')
export class PppoeOperacionAdminController {
  constructor(private readonly adminService: PppoeOperacionAdminService) {}

  @Get()
  async listar(@Query() query: ListarPppoeOperacionesQueryDto) {
    const resultado = await this.adminService.listar({
      page: query.page,
      limit: query.limit,
      search: query.search,
      cuentaPppoeId: query.cuentaPppoeId,
      mikrotikRouterId: query.mikrotikRouterId,
      perfilHomologacionId: query.perfilHomologacionId,
      instalacionId: query.instalacionId,
      desinstalacionId: query.desinstalacionId,
      iniciadoPorId: query.iniciadoPorId,
      reautenticadoPorId: query.reautenticadoPorId,
      reintentoDeId: query.reintentoDeId,
      tipos: query.tipos,
      origenes: query.origenes,
      canales: query.canales,
      estados: query.estados,
      requiereReautenticacion: query.requiereReautenticacion,
      numeroIntento: query.numeroIntento,
      fechaDesde: query.fechaDesde ? new Date(query.fechaDesde) : undefined,
      fechaHasta: query.fechaHasta ? new Date(query.fechaHasta) : undefined,
      ordenPor: query.ordenPor,
      ordenDireccion: query.ordenDireccion,
    });
    return PppoeOperacionPresenter.listado(resultado);
  }

  @Get(':operacionId')
  async obtenerDetalle(
    @Param('operacionId', ParseIntPipe) operacionId: number,
  ) {
    const resultado = await this.adminService.obtenerDetalle({ operacionId });
    return PppoeOperacionPresenter.detalle(resultado);
  }

  /** Reautentica al operador, autoriza la operación PENDIENTE y la ejecuta. */
  @Post(':operacionId/autorizar')
  @Roles(...ROLES_OFICINA)
  @OperacionSensible({ campoContrasena: 'password' })
  @HttpCode(HttpStatus.OK)
  async autorizar(
    @Param('operacionId', ParseIntPipe) operacionId: number,
    @Body() dto: AutorizarPppoeOperacionDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.adminService.autorizarYEjecutar({
      empresaId: actor.empresaId,
      operacionId,
      password: dto.password,
      actor: operador(actor),
    });
    return PppoeOperacionPresenter.ejecucion(resultado);
  }

  /**
   * Nuevo intento de una operación FALLIDA o PARCIAL; la anterior no cambia.
   * Las bajas manuales vuelven a pedir la contraseña.
   */
  @Post(':operacionId/reintentar')
  @Roles(...ROLES_OFICINA)
  @OperacionSensible()
  @HttpCode(HttpStatus.OK)
  async reintentar(
    @Param('operacionId', ParseIntPipe) operacionId: number,
    @Body() dto: ReintentarPppoeOperacionDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.adminService.reintentar({
      empresaId: actor.empresaId,
      operacionId,
      claveIdempotencia: dto.claveIdempotencia.trim(),
      motivo: dto.motivo?.trim() || null,
      contrasenaActual: dto.contrasenaActual ?? null,
      actor: operador(actor),
    });
    return PppoeOperacionPresenter.ejecucion(resultado);
  }

  /** Cierra una operación que quedó EJECUTANDO tras una caída; no repite comandos SSH. */
  @Post(':operacionId/recuperar')
  @Roles(...ROLES_OFICINA)
  @HttpCode(HttpStatus.OK)
  async recuperar(
    @Param('operacionId', ParseIntPipe) operacionId: number,
    @Body() dto: RecuperarPppoeOperacionDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.adminService.recuperar({
      empresaId: actor.empresaId,
      operacionId,
      confirmarAbandono: dto.confirmarAbandono,
      fecha: dto.fecha ? new Date(dto.fecha) : undefined,
      actor: operador(actor),
    });
    return PppoeOperacionPresenter.ejecucion(resultado);
  }

  /** Solo PENDIENTE o AUTORIZADA, antes de ejecutar pasos. */
  @Post(':operacionId/cancelar')
  @Roles(...ROLES_OFICINA)
  @HttpCode(HttpStatus.OK)
  async cancelar(
    @Param('operacionId', ParseIntPipe) operacionId: number,
    @Body() dto: CancelarPppoeOperacionDto,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.adminService.cancelar({
      empresaId: actor.empresaId,
      operacionId,
      motivo: dto.motivo,
      actor: operador(actor),
    });
    return PppoeOperacionPresenter.detalle(resultado);
  }
}

/** Sin nombre: las respuestas lo resuelven por operadorId. */
function operador(actor: ActorHttp) {
  return {
    operadorId: actor.usuarioId,
    operadorNombre: null,
    ipOrigen: actor.ip,
    userAgent: actor.userAgent,
  };
}
