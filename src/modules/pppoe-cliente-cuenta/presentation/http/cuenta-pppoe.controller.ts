import {
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import type { Request } from 'express';

import { ListarCuentasPppoeUseCase } from '../../application/use-cases/listar-cuentas-pppoe.use-case';

import { ListarCuentasPppoeQueryDto } from '../dto/listar-cuentas-pppoe-query.dto';

import { ObtenerDetalleCuentaPppoeUseCase } from '../../application/use-cases/obtener-detalle-cuenta-pppoe.use-case';

import { ConsultarCredencialesPppoeCuentaUseCase } from '../../application/use-cases/consultar-credenciales-pppoe-cuenta.use-case';

type AuthenticatedRequest = Request & {
  user?: {
    id?: number | string;

    sub?: number | string;

    userId?: number | string;

    empresaId?: number | string;

    nombre?: string;
  };
};

@Controller('pppoe-cuentas')
export class CuentaPppoeController {
  constructor(
    private readonly listarCuentasPppoe: ListarCuentasPppoeUseCase,

    private readonly obtenerDetalleCuentaPppoe: ObtenerDetalleCuentaPppoeUseCase,

    private readonly consultarCredencialesPppoeCuenta: ConsultarCredencialesPppoeCuentaUseCase,
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
   * Revela temporalmente las credenciales PPPoE
   * de una cuenta administrativa.
   *
   * La contraseña:
   *
   * - se descifra únicamente para esta respuesta;
   * - no se persiste en texto plano;
   * - no se incluye dentro de auditoría;
   * - la consulta queda registrada.
   */
  @Post(':cuentaPppoeId/revelar-credenciales')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async revelarCredenciales(
    @Param('cuentaPppoeId', ParseIntPipe)
    cuentaPppoeId: number,

    @Req()
    req: AuthenticatedRequest,
  ) {
    const actor = this.getAuthenticatedActor(req);

    return this.consultarCredencialesPppoeCuenta.execute({
      empresaId: actor.empresaId,

      cuentaPppoeId,

      operadorId: actor.operadorId,

      operadorNombre: actor.operadorNombre,

      ipOrigen: actor.ipOrigen,

      userAgent: actor.userAgent,
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

  private getAuthenticatedActor(req: AuthenticatedRequest): {
    empresaId: number;

    operadorId: number;

    operadorNombre: string | null;

    ipOrigen: string | null;

    userAgent: string | null;
  } {
    const empresaId = this.getAuthenticatedEmpresaId(req);

    const rawOperadorId = req.user?.id ?? req.user?.userId ?? req.user?.sub;

    const operadorId = Number(rawOperadorId);

    if (!Number.isInteger(operadorId) || operadorId <= 0) {
      throw new UnauthorizedException(
        'No fue posible identificar al operador autenticado.',
      );
    }

    return {
      empresaId,

      operadorId,

      operadorNombre: req.user?.nombre?.trim() || null,

      ipOrigen: this.getClientIp(req),

      userAgent: req.headers['user-agent']?.trim() || null,
    };
  }

  private getClientIp(req: AuthenticatedRequest): string | null {
    // IP real: req.ip con trust proxy 1 (Railway). No se lee x-forwarded-for a
    // mano: su primer valor lo puede inventar el cliente.
    return req.ip?.trim() || null;
  }
}
