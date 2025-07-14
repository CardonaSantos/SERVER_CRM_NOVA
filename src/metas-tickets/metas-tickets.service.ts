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
        data: {
          titulo: updateDto.titulo,
          fechaInicio: dayjs
            .tz(updateDto.fechaInicio, 'YYYY-MM-DD', 'America/Guatemala')
            .startOf('day')
            .toDate(),
          fechaFin: dayjs
            .tz(updateDto.fechaFin, 'YYYY-MM-DD', 'America/Guatemala')
            .startOf('day')
            .toDate(),
          metaTickets: updateDto.metaTickets,
          estado: updateDto.estado,
        },
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

    this.logger.debug(`incrementMeta llamado para tecnicoId=${tecnicoId}`);

    // 1) Listar todas las metas abiertas de este técnico, ordenadas de más nueva a más vieja
    const metasAbiertas = await this.prisma.metaTecnicoTicket.findMany({
      where: { tecnicoId, estado: 'ABIERTO' },
      orderBy: { creadoEn: 'desc' },
      take: 2, // solo trae un par para inspección rápida
    });
    this.logger.debug(
      `Metas ABIERTO encontradas (más recientes primero):\n` +
        JSON.stringify(metasAbiertas, null, 2),
    );

    // 2) Tomar la primera (la más reciente)
    const meta = metasAbiertas[0];
    if (!meta) {
      this.logger.debug('No hay ninguna meta abierta para este técnico');
      return null;
    }

    // 3) Incrementar
    const updated = await this.prisma.metaTecnicoTicket.update({
      where: { id: meta.id },
      data: { ticketsResueltos: { increment: 1 } },
    });
    this.logger.debug(
      `Meta ${meta.id} (creadaEn=${meta.creadoEn.toISOString()}) actualizada: ` +
        `ticketsResueltos pasó de ${meta.ticketsResueltos} a ${updated.ticketsResueltos}`,
    );

    return updated;
  }

  /**
   * Retorna los tickets con informacion para metricas
   */
  async getMetricasTicketsMes() {
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
    //otros datos
    const resueltosDelMes = await this.getResueltosDelMes();
    return {
      data,
      dataScale,
      ticketsActuales,
      ticketsEnProceso,
      resueltosDelMes,
    };
  }

  async getResueltosDelMes() {
    const TZ = 'America/Guatemala';

    // Fecha de inicio y fin de mes
    const inicioMes = dayjs().tz(TZ).startOf('month').toDate();
    const finMes = dayjs().tz(TZ).endOf('month').toDate();

    const ticketsResueltosDelMes = await this.prisma.ticketSoporte.count({
      where: {
        fechaApertura: { gte: inicioMes },
        fechaCierre: { lte: finMes },
        estado: 'RESUELTA',
      },
    });
    return ticketsResueltosDelMes; // un número
  }

  async getResueltosPorDiaMes(): Promise<
    Array<Record<'dia' | string, number>>
  > {
    const TZ = 'America/Guatemala';

    // 1) Rango inicio/fin de mes (cubre desde 00:00 hasta 23:59)
    const inicioMes = dayjs().tz(TZ).startOf('month').startOf('day').toDate();
    const finMes = dayjs().tz(TZ).endOf('month').endOf('day').toDate();
    this.logger.debug(
      `Rango para consulta: ${inicioMes.toISOString()} → ${finMes.toISOString()}`,
    );

    // 2) Traer todos los tickets cerrados (RESUELTA) en ese rango
    const tickets = await this.prisma.ticketSoporte.findMany({
      where: {
        estado: 'RESUELTA',
        fechaCierre: { gte: inicioMes, lte: finMes },
      },
      select: {
        fechaCierre: true,
        tecnico: {
          select: { id: true, nombre: true, rol: true },
        },
        asignaciones: {
          select: {
            tecnico: {
              select: { id: true, nombre: true, rol: true },
            },
          },
        },
      },
    });
    this.logger.debug(`Tickets resueltos encontrados: ${tickets.length}`);
    this.logger.debug('Detalle de tickets:', JSON.stringify(tickets, null, 2));

    // 3) Construir mapa [nombreTecnico] -> { dia: cantidad }
    const mapa = tickets.reduce<Record<string, Record<number, number>>>(
      (acc, t) => {
        const dia = dayjs(t.fechaCierre).tz(TZ).date();
        this.logger.debug(
          `Procesando ticket cierre=${t.fechaCierre.toISOString()} → día ${dia}`,
          {
            tecnico: t.tecnico,
            acompanantes: t.asignaciones.map((a) => a.tecnico),
          },
        );

        // Lista de todos los técnicos implicados que sean realmente 'TECNICO'
        const todos: Array<{ id: number; nombre: string; rol: string }> = [];
        if (t.tecnico?.rol === 'TECNICO') {
          todos.push(t.tecnico);
        }
        t.asignaciones.forEach(({ tecnico: comp }) => {
          if (comp.rol === 'TECNICO') {
            todos.push(comp);
          }
        });

        // Incrementar el conteo para cada técnico
        todos.forEach(({ nombre }) => {
          acc[nombre] = acc[nombre] || {};
          acc[nombre][dia] = (acc[nombre][dia] || 0) + 1;
        });

        return acc;
      },
      {},
    );

    // 3.5) Mapa total de tickets resueltos por día
    const totalMap: Record<number, number> = {};
    tickets.forEach((t) => {
      const d = dayjs(t.fechaCierre).tz(TZ).date();
      totalMap[d] = (totalMap[d] || 0) + 1;
    });

    this.logger.debug(
      'Mapa intermedio de técnicos por día:',
      JSON.stringify(mapa, null, 2),
    );

    // 4) Formatear el array final para el chart
    const diasTotales = dayjs(inicioMes).tz(TZ).daysInMonth();
    const lineChartData: Array<Record<'dia' | string, number>> = [];

    for (let dia = 1; dia <= diasTotales; dia++) {
      const fila: Record<'dia' | string, number> = { dia };

      // Rellenamos los contadores por técnico
      Object.keys(mapa).forEach((tec) => {
        fila[tec] = mapa[tec][dia] || 0;
      });

      // **Aquí** asignamos el total de tickets resueltos ese día
      fila['total'] = totalMap[dia] || 0;

      lineChartData.push(fila);
    }
    this.logger.debug(
      'Datos finales para gráfica de líneas:',
      JSON.stringify(lineChartData, null, 2),
    );

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
          estado: {
            in: ['EN_PROCESO', 'PENDIENTE_REVISION'],
          },
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
          asignaciones: {
            select: {
              tecnico: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
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

      const formatteados = esteDiaTickets.map((ticket) => ({
        ...ticket,
        acompanantes: ticket.asignaciones.map((t) => ({
          nombre: t.tecnico.nombre,
          id: t.tecnico.id,
        })),
      }));

      return formatteados;
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
