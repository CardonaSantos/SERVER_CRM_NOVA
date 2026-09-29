import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateTicketSeguimientoDto } from './dto/create-ticket-seguimiento.dto';
import { UpdateTicketSeguimientoDto } from './dto/update-ticket-seguimiento.dto';

@Injectable()
export class TicketSeguimientoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createTicketSeguimientoDto: CreateTicketSeguimientoDto,
    usuarioId: number,
  ) {
    const descripcion = createTicketSeguimientoDto.descripcion.trim();

    if (!descripcion) {
      throw new BadRequestException('El comentario debe contener texto.');
    }

    const [ticket, usuario] = await Promise.all([
      this.prisma.ticketSoporte.findUnique({
        where: { id: createTicketSeguimientoDto.ticketId },
        select: {
          id: true,
          empresaId: true,
          tecnicoId: true,
          asignaciones: { select: { tecnicoId: true } },
        },
      }),
      this.prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: {
          id: true,
          empresaId: true,
          nombre: true,
          rol: true,
          activo: true,
        },
      }),
    ]);

    if (!ticket) {
      throw new NotFoundException(
        `Ticket con id ${createTicketSeguimientoDto.ticketId} no encontrado.`,
      );
    }

    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${usuarioId} no encontrado.`);
    }

    if (!usuario.activo) {
      throw new ForbiddenException(
        'El usuario autenticado se encuentra inactivo.',
      );
    }

    if (
      ticket.empresaId !== null &&
      usuario.empresaId !== ticket.empresaId
    ) {
      throw new ForbiddenException('No tienes acceso a este ticket.');
    }

    if (usuario.rol === 'TECNICO') {
      const esTecnicoPrincipal = ticket.tecnicoId === usuario.id;
      const esTecnicoAdicional = ticket.asignaciones.some(
        (asignacion) => asignacion.tecnicoId === usuario.id,
      );

      if (!esTecnicoPrincipal && !esTecnicoAdicional) {
        throw new ForbiddenException(
          'Este ticket no está asignado al técnico autenticado.',
        );
      }
    }

    const comentario = await this.prisma.seguimientoTicket.create({
      data: {
        descripcion,
        ticket: { connect: { id: ticket.id } },
        usuario: { connect: { id: usuario.id } },
      },
      select: {
        id: true,
        ticketId: true,
        descripcion: true,
        fechaRegistro: true,
        actualizadoEn: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            rol: true,
            perfil: { select: { avatarUrl: true } },
          },
        },
      },
    });

    return {
      id: comentario.id,
      ticketId: comentario.ticketId,
      descripcion: comentario.descripcion,
      fechaRegistro: comentario.fechaRegistro.toISOString(),
      actualizadoEn: comentario.actualizadoEn.toISOString(),
      usuario: {
        id: comentario.usuario.id,
        nombre: comentario.usuario.nombre,
        rol: comentario.usuario.rol,
        avatarUrl: comentario.usuario.perfil?.avatarUrl ?? null,
      },
    };
  }

  findAll() {
    return `This action returns all ticketSeguimiento`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ticketSeguimiento`;
  }

  update(id: number, updateTicketSeguimientoDto: UpdateTicketSeguimientoDto) {
    return `This action updates a #${id} ticketSeguimiento`;
  }

  remove(id: number) {
    return `This action removes a #${id} ticketSeguimiento`;
  }
}
