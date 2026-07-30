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
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from 'src/auth/JwtGuard/jwt-auth.guard';

import { PppoeOperacionAdminService } from '../application/services/pppoe-operacion-admin.service';

import { AutorizarPppoeOperacionDto } from './dto/autorizar-pppoe-operacion.dto';
import { CancelarPppoeOperacionDto } from './dto/cancelar-pppoe-operacion.dto';
import { ListarPppoeOperacionesQueryDto } from './dto/listar-pppoe-operaciones-query.dto';
import { RecuperarPppoeOperacionDto } from './dto/recuperar-pppoe-operacion.dto';
import { ReintentarPppoeOperacionDto } from './dto/reintentar-pppoe-operacion.dto';

type AuthenticatedRequest = Request & {
  user?: {
    id?: number | string;
    sub?: number | string;
    userId?: number | string;
  };
};

/**
 * Contexto HTTP del operador autenticado.
 *
 * operadorNombre se mantiene en null únicamente para
 * conservar compatibilidad con el contrato actual del
 * servicio de aplicación.
 *
 * La fuente de verdad es operadorId, relacionado con Usuario.
 */
type ActorAdministrativoHttp = {
  operadorId: number;
  operadorNombre: null;
  ipOrigen: string | null;
  userAgent: string | null;
};

@UseGuards(JwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('pppoe-operaciones')
export class PppoeOperacionAdminController {
  constructor(private readonly adminService: PppoeOperacionAdminService) {}

  /**
   * Lista las operaciones PPPoE de forma paginada.
   */
  @Get()
  listar(
    @Query()
    query: ListarPppoeOperacionesQueryDto,
  ) {
    return this.adminService.listar({
      empresaId: query.empresaId,

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
  }

  /**
   * Obtiene el detalle enriquecido de una operación.
   */
  @Get(':operacionId')
  obtenerDetalle(
    @Param('operacionId', ParseIntPipe)
    operacionId: number,

    @Query('empresaId', ParseIntPipe)
    empresaId: number,
  ) {
    return this.adminService.obtenerDetalle({
      empresaId,
      operacionId,
    });
  }

  /**
   * Reautentica al operador y autoriza una operación
   * protegida que continúa en estado PENDIENTE.
   */
  @Post(':operacionId/autorizar')
  @HttpCode(HttpStatus.OK)
  autorizar(
    @Param('operacionId', ParseIntPipe)
    operacionId: number,

    @Body()
    dto: AutorizarPppoeOperacionDto,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.adminService.autorizarYEjecutar({
      empresaId: dto.empresaId,
      operacionId,
      password: dto.password,
      actor: this.getActor(req),
    });
  }

  /**
   * Crea una nueva operación a partir de una operación
   * FALLIDA o PARCIAL.
   *
   * La operación anterior no se modifica ni se reutiliza.
   */
  @Post(':operacionId/reintentar')
  @HttpCode(HttpStatus.OK)
  reintentar(
    @Param('operacionId', ParseIntPipe)
    operacionId: number,

    @Body()
    dto: ReintentarPppoeOperacionDto,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.adminService.reintentar({
      empresaId: dto.empresaId,
      operacionId,

      claveIdempotencia: dto.claveIdempotencia,
      motivo: dto.motivo ?? null,

      actor: this.getActor(req),
    });
  }

  /**
   * Recupera una operación que quedó EJECUTANDO
   * después de una interrupción.
   *
   * La recuperación no repite comandos SSH.
   */
  @Post(':operacionId/recuperar')
  @HttpCode(HttpStatus.OK)
  recuperar(
    @Param('operacionId', ParseIntPipe)
    operacionId: number,

    @Body()
    dto: RecuperarPppoeOperacionDto,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.adminService.recuperar({
      empresaId: dto.empresaId,
      operacionId,

      confirmarAbandono: dto.confirmarAbandono,

      fecha: dto.fecha ? new Date(dto.fecha) : undefined,

      actor: this.getActor(req),
    });
  }

  /**
   * Cancela una operación PENDIENTE o AUTORIZADA
   * que todavía no haya ejecutado pasos técnicos.
   */
  @Post(':operacionId/cancelar')
  @HttpCode(HttpStatus.OK)
  cancelar(
    @Param('operacionId', ParseIntPipe)
    operacionId: number,

    @Body()
    dto: CancelarPppoeOperacionDto,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.adminService.cancelar({
      empresaId: dto.empresaId,
      operacionId,
      motivo: dto.motivo,
      actor: this.getActor(req),
    });
  }

  /**
   * Obtiene exclusivamente del JWT la identidad
   * del operador que ejecuta la acción.
   */
  private getActor(req: AuthenticatedRequest): ActorAdministrativoHttp {
    const rawOperadorId = req.user?.id ?? req.user?.sub ?? req.user?.userId;

    const operadorId = Number(rawOperadorId);

    if (!Number.isInteger(operadorId) || operadorId <= 0) {
      throw new UnauthorizedException(
        'No fue posible identificar al operador autenticado.',
      );
    }

    return {
      operadorId,

      /**
       * No almacenamos snapshot del nombre.
       *
       * Los retornos pueden poblar la relación Usuario
       * mediante operadorId, iniciadoPorId o
       * reautenticadoPorId.
       */
      operadorNombre: null,

      ipOrigen: this.getClientIp(req),

      userAgent: req.headers['user-agent']?.trim() || null,
    };
  }

  /**
   * Obtiene la IP de origen de la petición.
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
