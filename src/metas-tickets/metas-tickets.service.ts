import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateMetasTicketDto } from './dto/create-metas-ticket.dto';
import { UpdateMetasTicketDto } from './dto/update-metas-ticket.dto';
import { MetaTecnicoTicket, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MetasTicketsService {
  private readonly logger = new Logger(MetasTicketsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea una nueva meta para el técnico.
   * @throws ConflictException si ya existe una meta en el mismo periodo para el técnico.
   * @throws InternalServerErrorException en errores inesperados.
   */
  async create(createDto: CreateMetasTicketDto): Promise<MetaTecnicoTicket> {
    try {
      const meta = await this.prisma.metaTecnicoTicket.create({
        data: {
          estado: 'ABIERTO',
          fechaInicio: createDto.fechaInicio,
          fechaFin: createDto.fechaFin,
          titulo: createDto.titulo ?? 'Sin titulo',
          tecnico: {
            connect: {
              id: createDto.tecnicoId,
            },
          },
          metaTickets: createDto.metaTickets,
        },
      });
      return meta;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe una meta para este técnico en el periodo especificado.',
        );
      }
      this.logger.error('Error al crear MetaTecnicoTicket', error);
      throw new InternalServerErrorException('Error interno al crear la meta.');
    }
  }

  /**
   * Obtiene todas las metas.
   */
  async findAll() {
    return this.prisma.metaTecnicoTicket.findMany({
      select: {
        id: true,
        cumplida: true,
        estado: true,
        fechaCumplida: true,
        fechaFin: true,
        fechaInicio: true,
        metaTickets: true,
        tecnico: {
          select: {
            id: true,
            nombre: true,
            rol: true,
            correo: true,
          },
        },
        titulo: true,
        ticketsResueltos: true,
      },
    });
  }

  /**
   * Obtiene una meta por su ID.
   * @throws NotFoundException si no existe la meta.
   * @throws InternalServerErrorException en errores inesperados.
   */
  async findOne(id: number): Promise<MetaTecnicoTicket> {
    try {
      const meta = await this.prisma.metaTecnicoTicket.findUnique({
        where: { id },
      });
      if (!meta) {
        throw new NotFoundException(
          `MetaTecnicoTicket con id ${id} no encontrada.`,
        );
      }
      return meta;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error al buscar MetaTecnicoTicket #${id}`, error);
      throw new InternalServerErrorException(
        'Error interno al buscar la meta.',
      );
    }
  }

  /**
   * Actualiza una meta existente.
   * @throws NotFoundException si no existe la meta.
   * @throws ConflictException en caso de conflicto de datos.
   * @throws InternalServerErrorException en errores inesperados.
   */
  async update(
    id: number,
    updateDto: UpdateMetasTicketDto,
  ): Promise<MetaTecnicoTicket> {
    await this.findOne(id);
    try {
      const updated = await this.prisma.metaTecnicoTicket.update({
        where: { id },
        data: updateDto,
      });
      return updated;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Datos duplicados o conflicto de llave única.',
        );
      }
      this.logger.error(`Error al actualizar MetaTecnicoTicket #${id}`, error);
      throw new InternalServerErrorException(
        'Error interno al actualizar la meta.',
      );
    }
  }

  /**
   * Elimina una meta por su ID.
   * @throws NotFoundException si no existe la meta.
   * @throws InternalServerErrorException en errores inesperados.
   */
  async remove(id: number): Promise<{ success: boolean }> {
    await this.findOne(id);
    try {
      await this.prisma.metaTecnicoTicket.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      this.logger.error(`Error al eliminar MetaTecnicoTicket #${id}`, error);
      throw new InternalServerErrorException(
        'Error interno al eliminar la meta.',
      );
    }
  }
}
