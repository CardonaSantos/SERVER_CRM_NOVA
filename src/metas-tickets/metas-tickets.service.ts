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
    /* ───────── Configuración de fechas ───────── */
    const TZ = 'America/Guatemala';
    const inicioMes = dayjs().tz(TZ).startOf('month').toDate();
    const finMes = dayjs().tz(TZ).endOf('month').toDate();

    const diasTrans = dayjs().tz(TZ).diff(dayjs(inicioMes), 'day') + 1;
    const totalDias = dayjs(finMes).diff(dayjs(inicioMes), 'day') + 1;

    const filtroFechas = {
      OR: [
        { fechaApertura: { gte: inicioMes, lte: finMes } }, // abiertos este mes
        { fechaCierre: { gte: inicioMes, lte: finMes } }, // o cerrados este mes
      ],
    };

    const usuarios = await this.prisma.usuario.findMany({
      where: { rol: { in: ['ADMIN', 'TECNICO'] } },
      select: {
        id: true,
        nombre: true,
        correo: true,
        ticketsAsignados: {
          where: filtroFechas,
          select: { fechaApertura: true, fechaCierre: true, estado: true },
        },
      },
    });

    const data = usuarios.map(({ id, nombre, correo, ticketsAsignados }) => {
      const totalTickets = ticketsAsignados.length;
      const ticketsResueltos = ticketsAsignados.filter(
        (t) => t.estado === 'RESUELTA',
      ).length;
      const ticketsPendientes = ticketsAsignados.filter(
        (t) => t.estado !== 'RESUELTA',
      ).length;

      const tasaResolucion = totalTickets
        ? Number(((ticketsResueltos / totalTickets) * 100).toFixed(1))
        : 0;

      const tiemposHrs = ticketsAsignados
        .filter((t) => t.fechaCierre)
        .map(
          (t) =>
            (t.fechaCierre!.getTime() - t.fechaApertura.getTime()) / 3_600_000,
        );

      const tiempoPromedioHrs = tiemposHrs.length
        ? Number(
            (
              tiemposHrs.reduce((sum, hrs) => sum + hrs, 0) / tiemposHrs.length
            ).toFixed(2),
          )
        : null;

      const ticketsPorDia = Number((ticketsResueltos / diasTrans).toFixed(2));
      const proyeccion = Math.round(ticketsPorDia * totalDias);

      return {
        tecnicoId: id,
        nombre,
        correo,
        totalTickets,
        ticketsResueltos,
        ticketsPendientes,
        tasaResolucion,
        tiempoPromedioHrs,
        ticketsPorDia,
        proyeccion,
        diasTranscurridos: diasTrans,
        totalDias,
      };
    });

    const dataScale = await this.getResueltosPorDiaMes();
    const ticketsActuales = await this.getTicketsActuales();
    const ticketsEnProceso = await this.getTicketsEnProceso();
    // --> Respuesta final
    return { data, dataScale, ticketsActuales, ticketsEnProceso };
  }

  async getResueltosPorDiaMes() {
    const TZ = 'America/Guatemala';

    const inicioMes = dayjs().tz(TZ).startOf('month').toDate();
    const finMes = dayjs().tz(TZ).endOf('month').toDate();

    const tickets = await this.prisma.ticketSoporte.findMany({
      where: {
        estado: 'RESUELTA',
        fechaCierre: { gte: inicioMes, lte: finMes },
        tecnico: { rol: 'TECNICO' },
      },
      select: {
        fechaCierre: true,
        tecnico: { select: { nombre: true } },
      },
    });

    const mapa: Record<string, Record<number, number>> = {};

    tickets.forEach(({ tecnico, fechaCierre }) => {
      const dia = dayjs(fechaCierre).tz(TZ).date(); // 1-31 local
      if (!mapa[tecnico.nombre]) mapa[tecnico.nombre] = {};
      mapa[tecnico.nombre][dia] = (mapa[tecnico.nombre][dia] || 0) + 1;
    });

    const diasTotales = dayjs(inicioMes).tz(TZ).daysInMonth(); // ✅ 30/31/28

    const lineChartData: any[] = [];
    for (let dia = 1; dia <= diasTotales; dia++) {
      const fila: any = { dia };
      Object.keys(mapa).forEach((tec) => {
        fila[tec] = mapa[tec][dia] || 0;
      });
      lineChartData.push(fila);
    }

    return lineChartData;
  }

  async getTicketsActuales() {
    const TZ = 'America/Guatemala';
    // rango en UTC
    const inicioDia = dayjs().tz(TZ).startOf('day').utc().toDate();
    const finDia = dayjs().tz(TZ).endOf('day').utc().toDate();

    // 1. Tickets abiertos hoy (disponibles)
    const tickets = await this.prisma.ticketSoporte.count({
      where: {
        estado: {
          notIn: ['ARCHIVADA', 'CANCELADA', 'CERRADO', 'RESUELTA'],
        },
        tecnicoId: undefined,
      },
    });

    // 2. Resueltos hoy (cerrados hoy sin importar cuándo se abrieron)
    const ticketsResueltos = await this.prisma.ticketSoporte.count({
      where: {
        estado: 'RESUELTA',
        fechaCierre: { gte: inicioDia, lte: finDia },
      },
    });

    // 3. En proceso (tickets EN_PROCESO con fechaInicioAtencion hoy)
    const ticketsEnProceso = await this.prisma.ticketSoporte.count({
      where: {
        estado: 'EN_PROCESO',
      },
    });

    // 4. Asignados hoy (tienen técnico y fueron abiertos hoy)
    const ticketsAsignados = await this.prisma.ticketSoporte.count({
      where: {
        fechaApertura: { gte: inicioDia, lte: finDia },
        tecnicoId: { not: null },
      },
    });

    return {
      tickets, // disponibles
      ticketsResueltos,
      ticketsEnProceso,
      ticketsAsignados,
    };
  }

  async getTicketsEnProceso() {
    try {
      const TZ = 'America/Guatemala';

      const inicioDia = dayjs().tz(TZ).startOf('day').toDate();
      const finDia = dayjs().tz(TZ).endOf('day').toDate();

      let esteDiaTickets = await this.prisma.ticketSoporte.findMany({
        where: {
          // fechaApertura: {
          //   gte: inicioDia,
          //   lte: finDia,
          // },
          estado: 'EN_PROCESO',
        },
        select: {
          id: true,
          titulo: true,
          descripcion: true,
          estado: true,
          prioridad: true,
          tecnico: {
            select: {
              id: true,
              nombre: true,
            },
          },
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
            },
          },
        },
      });

      return esteDiaTickets;
    } catch (error) {
      this.logger.error('Ocurrió un error', error);
      return error;
    }
  }

  async getTicketsEnProcesoDashboard() {
    try {
      const TZ = 'America/Guatemala';

      const inicioDia = dayjs().tz(TZ).startOf('day').toDate();
      const finDia = dayjs().tz(TZ).endOf('day').toDate();

      let esteDiaTickets = await this.prisma.ticketSoporte.findMany({
        where: {
          fechaApertura: {
            gte: inicioDia,
            lte: finDia,
          },
          estado: 'EN_PROCESO',
        },
        select: {
          id: true,
          titulo: true,
          descripcion: true,
          estado: true,
          prioridad: true,
          tecnico: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

      return esteDiaTickets;
    } catch (error) {
      this.logger.error('Ocurrió un error', error);
      return error;
    }
  }
}
