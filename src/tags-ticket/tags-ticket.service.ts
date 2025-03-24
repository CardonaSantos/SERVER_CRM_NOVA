import { Injectable } from '@nestjs/common';
import { CreateTagsTicketDto } from './dto/create-tags-ticket.dto';
import { UpdateTagsTicketDto } from './dto/update-tags-ticket.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TagsTicketService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createTagsTicketDto: CreateTagsTicketDto) {
    try {
      const newTagTicket = await this.prisma.etiquetaTicket.create({
        data: {
          nombre: createTagsTicketDto.nombre,
        },
      });
      console.log('Tag creada: ', newTagTicket);

      return newTagTicket;
    } catch (error) {
      console.log(error);
    }
  }

  async findAll() {
    try {
      // Obtener todas las etiquetas
      const etiquetas = await this.prisma.etiquetaTicket.findMany({
        select: {
          id: true,
          nombre: true,
          // Relación con TicketEtiqueta para contar los tickets asociados
          tickets: true,
        },
      });

      // Mapear las etiquetas y calcular la cantidad de tickets asociados
      const etiquetasConCount = etiquetas.map((etiqueta) => ({
        id: etiqueta.id,
        nombre: etiqueta.nombre,
        ticketsCount: etiqueta.tickets.length, // Contamos la cantidad de tickets asociados
      }));

      return etiquetasConCount;
    } catch (error) {
      console.error('Error al obtener las etiquetas:', error);
      throw new Error('No se pudo obtener las etiquetas');
    }
  }

  async getEtiquetasToTicket() {
    try {
      const tags = this.prisma.etiquetaTicket.findMany({
        select: {
          id: true,
          nombre: true,
        },
      });
      return tags;
    } catch (error) {
      console.log(error);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} tagsTicket`;
  }

  update(id: number, updateTagsTicketDto: UpdateTagsTicketDto) {
    return `This action updates a #${id} tagsTicket`;
  }

  remove(id: number) {
    return `This action removes a #${id} tagsTicket`;
  }
}
