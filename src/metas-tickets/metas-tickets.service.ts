import {
  BadRequestException,
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
import * as dayjs from 'dayjs';
import * as timezone from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
dayjs.extend(timezone);

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
      console.log('La data entrando es: ', createDto);

      const meta = await this.prisma.metaTecnicoTicket.create({
        data: {
          estado: 'ABIERTO',
          fechaInicio: dayjs
            .tz(createDto.fechaInicio, 'YYYY-MM-DD', 'America/Guatemala')
            .startOf('day')
            .toDate(),
          fechaFin: dayjs
            .tz(createDto.fechaFin, 'YYYY-MM-DD', 'America/Guatemala')
            .startOf('day')
            .toDate(),
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

  /**
   *
   * @param tecnicoId ID del tecnico a incrementar su meta
   */
  async incrementMeta(tecnicoId: number) {
    if (!tecnicoId) {
      throw new BadRequestException('Se requiere el ID del técnico');
    }
    const hoy = dayjs().tz('America/Guatemala').startOf('day').toDate();
    const metaVigente = await this.prisma.metaTecnicoTicket.findFirst({
      where: {
        tecnicoId,
        estado: 'ABIERTO',
        fechaInicio: { lte: hoy },
        fechaFin: { gte: hoy },
      },
      orderBy: { creadoEn: 'desc' },
    });

    if (!metaVigente) {
      this.logger.debug('Meta no encontrada');
      return null;
    }

    return this.prisma.metaTecnicoTicket.update({
      where: { id: metaVigente.id },
      data: { ticketsResueltos: { increment: 1 } },
    });
  }

  /**
   * Retorna los tickets con informacion para metricas
   */
  async getMetricasTicketsMes() {
    const inicioMes = dayjs().tz('America/Guatemala').startOf('month');
    const finMes = dayjs().tz('America/Guatemala').endOf('month');
    const diasTrans =
      dayjs().tz('America/Guatemala').diff(inicioMes, 'day') + 1;
    const totalDias = finMes.diff(inicioMes, 'day') + 1;

    const usuarios = await this.prisma.usuario.findMany({
      where: { rol: 'TECNICO' },
      select: {
        id: true,
        nombre: true,
        correo: true,
        ticketsAsignados: {
          where: {
            fechaApertura: { gte: inicioMes.toDate(), lte: finMes.toDate() },
          },
          select: {
            fechaApertura: true,
            fechaCierre: true,
            estado: true,
          },
        },
      },
    });

    return usuarios.map((u) => {
      const tickets = u.ticketsAsignados;
      const total = tickets.length;
      const resueltos = tickets.filter((t) => t.estado === 'RESUELTA').length;
      const pendientes = total - resueltos;
      const tasa = total ? +((100 * resueltos) / total).toFixed(1) : 0;

      const tiempos = tickets
        .filter((t) => t.fechaCierre)
        .map(
          (t) =>
            (new Date(t.fechaCierre).getTime() -
              new Date(t.fechaApertura).getTime()) /
            3600000,
        );
      const avgTime = tiempos.length
        ? +(tiempos.reduce((a, b) => a + b, 0) / tiempos.length).toFixed(2)
        : null;

      const ticketsPorDia = diasTrans ? +(resueltos / diasTrans).toFixed(2) : 0;
      const proyeccion = +(ticketsPorDia * totalDias).toFixed(0);

      return {
        tecnicoId: u.id,
        nombre: u.nombre,
        correo: u.correo,
        totalTickets: total,
        ticketsResueltos: resueltos,
        ticketsPendientes: pendientes,
        tasaResolucion: tasa,
        tiempoPromedioHrs: avgTime,
        ticketsPorDia,
        proyeccion,
        diasTranscurridos: diasTrans,
        totalDias,
      };
    });
  }
}
