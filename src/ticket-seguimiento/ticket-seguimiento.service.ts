import { Injectable } from '@nestjs/common';
import { CreateTicketSeguimientoDto } from './dto/create-ticket-seguimiento.dto';
import { UpdateTicketSeguimientoDto } from './dto/update-ticket-seguimiento.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TicketSeguimientoService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createTicketSeguimientoDto: CreateTicketSeguimientoDto) {
    try {
      console.log('La data es: ', createTicketSeguimientoDto);

      const newComentaryFollowUp = await this.prisma.seguimientoTicket.create({
        data: {
          descripcion: createTicketSeguimientoDto.descripcion,
          ticket: {
            connect: {
              id: createTicketSeguimientoDto.ticketId,
            },
          },
          usuario: {
            connect: {
              id: createTicketSeguimientoDto.usuarioId,
            },
          },
        },
      });
      return newComentaryFollowUp;
    } catch (error) {
      console.log(error);
    }
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
