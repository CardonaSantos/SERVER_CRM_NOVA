import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { Roles } from 'src/auth/decoradores/roles.decorator';
import { ROLES_OFICINA, ROLES_TECNICO } from 'src/auth/roles/grupos-roles';
import { CrearTicketConformidadUseCase } from '../../application/use-cases/crear-ticket-conformidad.use-case';
import { ObtenerConformidadActualTicketUseCase } from '../../application/use-cases/obtener-conformidad-actual-ticket.use-case';
import { ObtenerDetalleTicketConformidadUseCase } from '../../application/use-cases/obtener-detalle-ticket-conformidad.use-case';
import { ObtenerHistorialConformidadTicketUseCase } from '../../application/use-cases/obtener-historial-conformidad-ticket.use-case';
import { RegistrarFirmaTecnicoTicketConformidadUseCase } from '../../application/use-cases/registrar-firma-tecnico-ticket-conformidad.use-case';
import { TicketSoporteConformidadPresenter } from '../presenters/ticket-soporte-conformidad.presenter';

@ApiTags('ticket-soporte-conformidad')
@Controller('ticket-soporte-conformidad')
export class TicketSoporteConformidadController {
  constructor(
    private readonly crearConformidad: CrearTicketConformidadUseCase,
    private readonly registrarFirmaTecnico: RegistrarFirmaTecnicoTicketConformidadUseCase,
    private readonly obtenerDetalle: ObtenerDetalleTicketConformidadUseCase,
    private readonly obtenerActual: ObtenerConformidadActualTicketUseCase,
    private readonly obtenerHistorial: ObtenerHistorialConformidadTicketUseCase,
  ) {}

  @Post('tickets/:ticketId')
  @Roles(...ROLES_OFICINA, ...ROLES_TECNICO)
  async crear(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Actor() actor: ActorHttp,
  ) {
    return TicketSoporteConformidadPresenter.creada(
      await this.crearConformidad.execute({
        ticketId,
        creadoPorId: actor.usuarioId,
      }),
    );
  }

  @Post(':conformidadId/firma-tecnico')
  @Roles(...ROLES_OFICINA, ...ROLES_TECNICO)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('firma'))
  async firmarComoTecnico(
    @Param('conformidadId', ParseIntPipe) conformidadId: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Actor() actor: ActorHttp,
  ) {
    return TicketSoporteConformidadPresenter.firmaTecnico(
      await this.registrarFirmaTecnico.execute({
        conformidadId,
        usuarioFirmanteId: actor.usuarioId,
        nombreFirmante: actor.nombre,
        firma: file
          ? {
              bytes: file.buffer,
              mimeType: file.mimetype,
              nombreArchivo: file.originalname || 'firma-tecnico.png',
            }
          : null,
        ipOrigen: actor.ip,
        userAgent: actor.userAgent,
      }),
    );
  }

  @Get(':conformidadId')
  async detalle(@Param('conformidadId', ParseIntPipe) conformidadId: number) {
    return TicketSoporteConformidadPresenter.detalle(
      await this.obtenerDetalle.execute(conformidadId),
    );
  }

  @Get('tickets/:ticketId/actual')
  async actualPorTicket(@Param('ticketId', ParseIntPipe) ticketId: number) {
    return TicketSoporteConformidadPresenter.detalle(
      await this.obtenerActual.execute(ticketId),
    );
  }

  @Get('tickets/:ticketId/historial')
  async historialPorTicket(@Param('ticketId', ParseIntPipe) ticketId: number) {
    return TicketSoporteConformidadPresenter.historial(
      await this.obtenerHistorial.execute(ticketId),
    );
  }
}
