import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from 'src/auth/JwtGuard/jwt-auth.guard';

import { ListarCuentasPppoeUseCase } from '../application/use-cases/listar-cuentas-pppoe.use-case';

import { ListarCuentasPppoeQueryDto } from './dto/listar-cuentas-pppoe-query.dto';
import { ObtenerDetalleCuentaPppoeUseCase } from '../application/use-cases/obtener-detalle-cuenta-pppoe.use-case';

type AuthenticatedRequest = Request & {
  user?: {
    id?: number | string;
    sub?: number | string;
    userId?: number | string;

    empresaId?: number | string;

    nombre?: string;
  };
};

/**
 * Consultas administrativas de cuentas PPPoE.
 *
 * No ejecuta acciones contra MikroTik.
 *
 * Las operaciones de:
 *
 * - provisionamiento;
 * - suspensión;
 * - reactivación;
 * - reintento;
 * - recuperación;
 *
 * permanecen en los controladores especializados
 * del módulo de automatización.
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
export class PppoeCuentaConsultaController {
  constructor(
    private readonly listarCuentasPppoe: ListarCuentasPppoeUseCase,

    private readonly obtenerDetalleCuentaPppoe: ObtenerDetalleCuentaPppoeUseCase,
  ) {}

  /**
   * Lista cuentas PPPoE mediante paginación server-side.
   *
   * empresaId se obtiene exclusivamente del JWT.
   */
  @Get()
  listar(
    @Query()
    query: ListarCuentasPppoeQueryDto,

    @Req()
    req: AuthenticatedRequest,
  ) {
    const empresaId = this.getAuthenticatedEmpresaId(req);

    return this.listarCuentasPppoe.execute({
      empresaId,

      page: query.page,

      limit: query.limit,

      search: query.search,

      clienteId: query.clienteId,

      servicioInternetId: query.servicioInternetId,

      mikrotikRouterId: query.mikrotikRouterId,

      perfilHomologacionId: query.perfilHomologacionId,

      estadoCuenta: query.estadoCuenta,

      estadoAcceso: query.estadoAcceso,

      origen: query.origen,
    });
  }

  /**
   * Obtiene el estado administrativo completo
   * de una cuenta PPPoE.
   *
   * El historial completo se consulta mediante:
   *
   * GET /pppoe-operaciones?cuentaPppoeId=:id
   */
  @Get(':cuentaPppoeId')
  obtenerDetalle(
    @Param('cuentaPppoeId', ParseIntPipe)
    cuentaPppoeId: number,

    @Req()
    req: AuthenticatedRequest,
  ) {
    const empresaId = this.getAuthenticatedEmpresaId(req);

    return this.obtenerDetalleCuentaPppoe.execute({
      empresaId,

      cuentaPppoeId,
    });
  }

  private getAuthenticatedEmpresaId(req: AuthenticatedRequest): number {
    const empresaId = Number(req.user?.empresaId);

    if (!Number.isInteger(empresaId) || empresaId <= 0) {
      throw new UnauthorizedException(
        'No fue posible identificar la empresa del usuario autenticado.',
      );
    }

    return empresaId;
  }
}
