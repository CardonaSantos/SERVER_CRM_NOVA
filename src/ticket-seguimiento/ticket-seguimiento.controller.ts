import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from 'src/auth/JwtGuard/jwt-auth.guard';

import { CreateTicketSeguimientoDto } from './dto/create-ticket-seguimiento.dto';
import { UpdateTicketSeguimientoDto } from './dto/update-ticket-seguimiento.dto';
import { TicketSeguimientoService } from './ticket-seguimiento.service';

type AuthenticatedRequest = Request & {
  user?: {
    id?: number | string;
    sub?: number | string;
    userId?: number | string;
    nombre?: string;
    rol?: string;
    empresaId?: number | string;
  };
};

@Controller('ticket-seguimiento')
export class TicketSeguimientoController {
  constructor(
    private readonly ticketSeguimientoService: TicketSeguimientoService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createTicketSeguimientoDto: CreateTicketSeguimientoDto,
  ) {
    const rawUsuarioId =
      req.user?.id ?? req.user?.sub ?? req.user?.userId;

    const usuarioId = Number(rawUsuarioId);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new UnauthorizedException(
        'No fue posible identificar al usuario autenticado.',
      );
    }

    return this.ticketSeguimientoService.create(
      createTicketSeguimientoDto,
      usuarioId,
    );
  }

  @Get()
  findAll() {
    return this.ticketSeguimientoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketSeguimientoService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTicketSeguimientoDto: UpdateTicketSeguimientoDto,
  ) {
    return this.ticketSeguimientoService.update(
      +id,
      updateTicketSeguimientoDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketSeguimientoService.remove(+id);
  }
}
