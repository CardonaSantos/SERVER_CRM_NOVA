import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import type { Request } from 'express';
import { TicketConformidadApplicationService } from '../application/services/ticket-soporte-conformidad.service';
import { TicketConformidadTokenParamDto } from '../application/dto/ticket-conformidad-token-param.dto';
import { RegistrarFirmaClienteDto } from '../application/dto/registrar-firma-cliente.dto';

@UsePipes(
  new ValidationPipe({
    transform: true,

    whitelist: true,

    forbidNonWhitelisted: true,
  }),
)
@Controller('ticket-soporte-conformidad/public')
export class TicketConformidadPublicController {
  constructor(private readonly service: TicketConformidadApplicationService) {}

  /* =======================================================
   * CONSULTAR LINK
   * ===================================================== */

  @Get(':token')
  async obtener(
    @Param()
    params: TicketConformidadTokenParamDto,
  ) {
    return this.service.obtenerPublica(params.token);
  }

  /* =======================================================
   * NO ESTOY CONFORME
   * ===================================================== */

  @Post(':token/retrabajo')
  @HttpCode(HttpStatus.OK)
  async requerirRetrabajo(
    @Param()
    params: TicketConformidadTokenParamDto,
  ) {
    return this.service.requerirRetrabajo(params.token);
  }

  /* =======================================================
   * SÍ ESTOY CONFORME + FIRMA
   * ===================================================== */

  @Post(':token/firma')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('firma'))
  async registrarFirma(
    @Param()
    params: TicketConformidadTokenParamDto,

    @Body()
    dto: RegistrarFirmaClienteDto,

    @UploadedFile()
    file: Express.Multer.File,

    @Req()
    req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('La firma es requerida.');
    }

    return this.service.registrarFirmaCliente({
      token: params.token,

      nombreFirmante: dto.nombreFirmante,

      telefonoFirmante: dto.telefonoFirmante,

      firma: {
        bytes: file.buffer,

        mimeType: file.mimetype,

        nombreArchivo: file.originalname || 'firma.png',
      },

      ipOrigen: this.getClientIp(req),

      userAgent: req.headers['user-agent']?.trim() || null,
    });
  }

  private getClientIp(req: Request): string | null {
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
