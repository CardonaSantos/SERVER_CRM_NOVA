import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/JwtGuard/jwt-auth.guard';
import { TicketConformidadApplicationService } from '../application/services/ticket-soporte-conformidad.service';
import { TicketIdParamDto } from '../application/dto/ticket-id-param.dto';
import { GenerarEnlaceTicketConformidadDto } from '../application/dto/generar-enlace-ticket-conformidad.dto';
import { TicketConformidadIdParamDto } from '../application/dto/ticket-conformidad-id-param.dto';

type AuthenticatedRequest = Request & {
  user?: {
    id?: number | string;

    sub?: number | string;

    nombre?: string;

    empresaId?: number | string;

    rol?: string;
  };
};

@UseGuards(JwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,

    whitelist: true,

    forbidNonWhitelisted: true,
  }),
)
@Controller('ticket-soporte-conformidad')
export class TicketConformidadController {
  constructor(private readonly service: TicketConformidadApplicationService) {}

  /* =======================================================
   * CREAR CICLO
   * ===================================================== */

  @Post('tickets/:ticketId')
  async crear(
    @Param()
    params: TicketIdParamDto,

    @Req()
    req: AuthenticatedRequest,
  ) {
    const actor = this.getAuthenticatedActor(req);

    return this.service.crear({
      ticketId: params.ticketId,

      creadoPorId: actor.operadorId,
    });
  }

  /* =======================================================
   * GENERAR ENLACE
   * ===================================================== */

  @Post(':conformidadId/enlaces')
  async generarEnlace(
    @Param()
    params: TicketConformidadIdParamDto,

    @Body()
    dto: GenerarEnlaceTicketConformidadDto,

    @Req()
    req: AuthenticatedRequest,
  ) {
    const actor = this.getAuthenticatedActor(req);

    return this.service.generarEnlace({
      conformidadId: params.conformidadId,

      canal: dto.canal,

      telefonoDestino: dto.telefonoDestino ?? null,

      creadoPorId: actor.operadorId,
    });
  }

  /* =======================================================
   * DETALLE DE UNA CONFORMIDAD
   * ===================================================== */

  @Get(':conformidadId')
  async obtenerDetalle(
    @Param()
    params: TicketConformidadIdParamDto,
  ) {
    return this.service.obtenerDetalle(params.conformidadId);
  }

  /* =======================================================
   * ÚLTIMO CICLO DEL TICKET
   * ===================================================== */

  @Get('tickets/:ticketId/actual')
  async obtenerActualPorTicket(
    @Param()
    params: TicketIdParamDto,
  ) {
    return this.service.obtenerActualPorTicket(params.ticketId);
  }

  /* =======================================================
   * HISTORIAL COMPLETO
   * ===================================================== */

  @Get('tickets/:ticketId/historial')
  async obtenerHistorialPorTicket(
    @Param()
    params: TicketIdParamDto,
  ) {
    return this.service.obtenerHistorialPorTicket(params.ticketId);
  }

  /* =======================================================
   * ACTOR
   * ===================================================== */

  private getAuthenticatedActor(req: AuthenticatedRequest): {
    operadorId: number;

    operadorNombre: string | null;

    ipOrigen: string | null;

    userAgent: string | null;
  } {
    const rawOperadorId = req.user?.id ?? req.user?.sub;

    const operadorId = Number(rawOperadorId);

    if (!Number.isInteger(operadorId) || operadorId <= 0) {
      throw new UnauthorizedException(
        'No fue posible identificar al operador autenticado.',
      );
    }

    return {
      operadorId,

      operadorNombre: req.user?.nombre?.trim() || null,

      ipOrigen: this.getClientIp(req),

      userAgent: req.headers['user-agent']?.trim() || null,
    };
  }

  private getClientIp(req: AuthenticatedRequest): string | null {
    const forwardedFor = req.headers['x-forwarded-for'];

    if (typeof forwardedFor === 'string') {
      const firstIp = forwardedFor.split(',')[0]?.trim();

      return firstIp || null;
    }

    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      return forwardedFor[0]?.split(',')[0]?.trim() || null;
    }

    return req.ip?.trim() || null;
  }
}
