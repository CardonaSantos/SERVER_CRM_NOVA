import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { dayjs } from 'src/Utils/dayjs.config';
import { PrismaService } from 'src/prisma/prisma.service';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { TZ } from 'src/Utils/tzgt';
import { EstadoInstalacionCliente } from 'src/modules/cliente-instalacion/domain/enums/estado-instalacion-cliente.enum';
import {
  EstadoTicketSoporte,
  PrioridadTicketSoporte,
  Prisma,
} from '@prisma/client';
import {
  average,
  buildMonthlyActivity,
  getDashboardRangesGuatemala,
  getMaximumActivityDay,
  getMinimumActivityDay,
  getMinutesBetween,
  getTicketResolutionDate,
  isFiniteNumber,
  round,
} from './dashboard-tecnico.utils';
import { isDate } from 'util/types';
import {
  DashboardTicketsActividadQueryDto,
  DashboardTicketsPreset,
} from './dto/dashboard-tickets-actividad-query.dto';

const TICKET_ESTADOS_TERMINALES: EstadoTicketSoporte[] = [
  EstadoTicketSoporte.RESUELTA,
  EstadoTicketSoporte.CERRADO,
  EstadoTicketSoporte.CANCELADA,
  EstadoTicketSoporte.ARCHIVADA,
];

const INSTALACION_ESTADOS_ACTIVOS: EstadoInstalacionCliente[] = [
  EstadoInstalacionCliente.PROGRAMADA,
  EstadoInstalacionCliente.REPROGRAMADA,
  EstadoInstalacionCliente.EN_PROCESO,
];

const TICKET_ESTADOS_RESUELTOS: EstadoTicketSoporte[] = [
  EstadoTicketSoporte.RESUELTA,
  EstadoTicketSoporte.CERRADO,
];

type TicketsGranularidad = 'DIA' | 'MES' | 'TRIMESTRE' | 'ANIO';

type TicketsPrioridadCount = Record<PrioridadTicketSoporte, number>;

type TicketsActividadPoint = {
  periodo: string;

  creados: number;
  resueltos: number;

  prioridades: {
    creados: TicketsPrioridadCount;
    resueltos: TicketsPrioridadCount;
  };
};

@Injectable()
export class DashboardService {
  private logger = new Logger(DashboardService.name);
  constructor(private readonly prisma: PrismaService) {}

  async get_dashboard_panel_tecnico(tecnicoId: number) {
    const ahora = new Date();

    const {
      year,
      month,
      day,
      inicioMes,
      finMes,
      inicioHoy,
      finHoy,
      diasTranscurridos,
    } = getDashboardRangesGuatemala(ahora);

    const hace48Horas = new Date(ahora.getTime() - 48 * 60 * 60 * 1000);

    const participacionTicketWhere = {
      OR: [
        {
          tecnicoId,
        },
        {
          asignaciones: {
            some: {
              tecnicoId,
            },
          },
        },
      ],
    } satisfies Prisma.TicketSoporteWhereInput;

    const asignacionInstalacionWhere = {
      tecnicos: {
        some: {
          tecnicoId,
        },
      },
    } satisfies Prisma.ClienteInstalacionWhereInput;

    const ticketsActivosWhere = {
      AND: [
        participacionTicketWhere,
        {
          estado: {
            notIn: ['CERRADO', 'RESUELTA', 'CANCELADA'],
          },
        },
      ],
    } satisfies Prisma.TicketSoporteWhereInput;

    const ticketsListosWhere = {
      AND: [
        participacionTicketWhere,
        {
          estado: {
            notIn: ['CERRADO', 'RESUELTA', 'CANCELADA', 'PENDIENTE_CLIENTE'],
          },
        },
      ],
    } satisfies Prisma.TicketSoporteWhereInput;

    const instalacionesActivasWhere = {
      AND: [
        asignacionInstalacionWhere,
        {
          estado: {
            in: ['PROGRAMADA', 'REPROGRAMADA', 'EN_PROCESO'],
          },
        },
      ],
    } satisfies Prisma.ClienteInstalacionWhereInput;

    const ticketsResueltosMesWhere = {
      AND: [
        participacionTicketWhere,
        {
          estado: 'RESUELTA',
        },
        {
          OR: [
            {
              fechaResolucionTecnico: {
                gte: inicioMes,
                lt: finMes,
              },
            },
            {
              fechaCierre: {
                gte: inicioMes,
                lt: finMes,
              },
            },
            {
              asignaciones: {
                some: {
                  tecnicoId,
                  resolvioEn: {
                    gte: inicioMes,
                    lt: finMes,
                  },
                },
              },
            },
          ],
        },
      ],
    } satisfies Prisma.TicketSoporteWhereInput;

    const instalacionesCompletadasMesWhere = {
      AND: [
        {
          estado: 'COMPLETADA',
        },
        {
          fechaFinalizacion: {
            gte: inicioMes,
            lt: finMes,
          },
        },
        {
          OR: [
            {
              completadoPorId: tecnicoId,
            },
            asignacionInstalacionWhere,
          ],
        },
      ],
    } satisfies Prisma.ClienteInstalacionWhereInput;

    const [
      tecnico,

      ticketsPendientes,
      ticketsListosParaTrabajar,
      ticketsUrgentes,
      ticketsConMas48Horas,

      instalacionesPendientes,
      instalacionesProgramadasHoy,
      instalacionesAtrasadas,

      ticketsResueltosMes,
      instalacionesCompletadasMes,
    ] = await Promise.all([
      this.prisma.usuario.findUnique({
        where: {
          id: tecnicoId,
        },
        select: {
          id: true,
          nombre: true,
          correo: true,
          rol: true,
          activo: true,
        },
      }),

      this.prisma.ticketSoporte.count({
        where: ticketsActivosWhere,
      }),

      this.prisma.ticketSoporte.count({
        where: ticketsListosWhere,
      }),

      this.prisma.ticketSoporte.count({
        where: {
          AND: [
            ticketsActivosWhere,
            {
              prioridad: 'URGENTE',
            },
          ],
        },
      }),

      this.prisma.ticketSoporte.count({
        where: {
          AND: [
            ticketsActivosWhere,
            {
              fechaApertura: {
                lt: hace48Horas,
              },
            },
          ],
        },
      }),

      this.prisma.clienteInstalacion.count({
        where: instalacionesActivasWhere,
      }),

      this.prisma.clienteInstalacion.count({
        where: {
          AND: [
            instalacionesActivasWhere,
            {
              fechaProgramada: {
                gte: inicioHoy,
                lt: finHoy,
              },
            },
          ],
        },
      }),

      this.prisma.clienteInstalacion.count({
        where: {
          AND: [
            instalacionesActivasWhere,
            {
              fechaProgramada: {
                lt: inicioHoy,
              },
            },
          ],
        },
      }),

      /*
       * Solo se seleccionan las fechas necesarias para:
       * - calcular duración;
       * - agrupar por día.
       */
      this.prisma.ticketSoporte.findMany({
        where: ticketsResueltosMesWhere,
        select: {
          id: true,
          fechaApertura: true,
          fechaAsignacion: true,
          fechaInicioAtencion: true,
          fechaResolucionTecnico: true,
          fechaCierre: true,

          asignaciones: {
            where: {
              tecnicoId,
            },
            select: {
              resolvioEn: true,
              tiempoTecnicoMinutos: true,
            },
          },
        },
      }),

      this.prisma.clienteInstalacion.findMany({
        where: instalacionesCompletadasMesWhere,
        select: {
          id: true,
          fechaProgramada: true,
          fechaInicio: true,
          fechaFinalizacion: true,

          tecnicos: {
            where: {
              tecnicoId,
            },
            select: {
              tiempoMinutos: true,
            },
          },
        },
      }),
    ]);

    if (!tecnico) {
      throw new NotFoundException('El técnico no existe');
    }

    const tiemposResolucionTicket = ticketsResueltosMes
      .map((ticket) => {
        /*
         * Inicio preferido:
         * 1. Inicio real de atención.
         * 2. Asignación.
         * 3. Apertura.
         */
        const inicio =
          ticket.fechaInicioAtencion ??
          ticket.fechaAsignacion ??
          ticket.fechaApertura;

        /*
         * Final preferido:
         * 1. Resolución técnica.
         * 2. Cierre.
         * 3. Resolución registrada en su asignación.
         */
        const final =
          ticket.fechaResolucionTecnico ??
          ticket.fechaCierre ??
          ticket.asignaciones[0]?.resolvioEn ??
          null;

        return getMinutesBetween(inicio, final);
      })
      .filter(isFiniteNumber);

    const tiemposInstalacion = instalacionesCompletadasMes
      .map((instalacion) => {
        const tiempoRegistrado = instalacion.tecnicos[0]?.tiempoMinutos;

        if (typeof tiempoRegistrado === 'number' && tiempoRegistrado >= 0) {
          return tiempoRegistrado;
        }

        return getMinutesBetween(
          instalacion.fechaInicio ?? instalacion.fechaProgramada,
          instalacion.fechaFinalizacion,
        );
      })
      .filter(isFiniteNumber);

    const actividadDiaria = buildMonthlyActivity({
      year,
      month,
      currentDay: day,

      ticketDates: ticketsResueltosMes
        .map(getTicketResolutionDate)
        .filter(isDate),

      installationDates: instalacionesCompletadasMes
        .map((instalacion) => instalacion.fechaFinalizacion)
        .filter(isDate),
    });

    const diasConActividad = actividadDiaria.filter((item) => item.total > 0);

    const diaMasProductivo = getMaximumActivityDay(diasConActividad);

    const diaMenosProductivoConActividad =
      getMinimumActivityDay(diasConActividad);

    const ticketsResueltos = ticketsResueltosMes.length;

    const instalacionesCompletadas = instalacionesCompletadasMes.length;

    const trabajosCompletados = ticketsResueltos + instalacionesCompletadas;

    return {
      tecnico,

      periodo: {
        inicioMes,
        finMes,
        diasTranscurridos,
        zonaHoraria: 'America/Guatemala',
      },

      cargaActual: {
        ticketsPendientes,
        ticketsListosParaTrabajar,
        ticketsUrgentes,
        ticketsConMas48Horas,

        instalacionesPendientes,
        instalacionesProgramadasHoy,
        instalacionesAtrasadas,
      },

      productividadMes: {
        ticketsResueltos,
        instalacionesCompletadas,
        trabajosCompletados,
        diasConActividad: diasConActividad.length,

        promedioTicketsPorDia: round(ticketsResueltos / diasTranscurridos, 2),

        /*
         * Ritmo proyectado usando los días transcurridos:
         * tickets / días * 7.
         */
        ritmoSemanalTickets: round(
          (ticketsResueltos / diasTranscurridos) * 7,
          2,
        ),

        promedioTrabajosPorDiaActivo:
          diasConActividad.length > 0
            ? round(trabajosCompletados / diasConActividad.length, 2)
            : 0,
      },

      tiempos: {
        promedioResolucionTicketMinutos: average(tiemposResolucionTicket),

        promedioInstalacionMinutos: average(tiemposInstalacion),
      },

      resumenActividad: {
        diaMasProductivo,
        diaMenosProductivoConActividad,
      },

      actividadDiaria,
    };
  }

  async create() {}

  /**
   * Devuelve todos los tickets activos de un técnico,
   * formateados para el frontend.
   */
  async findAll(tecnicoId: number) {
    console.log('El id del tecnico es: ', tecnicoId);

    const user = await this.prisma.usuario.findUnique({
      where: {
        id: tecnicoId,
      },
    });
    console.log('El usuario encontrado es: ', user);

    const rawTickets = await this.prisma.ticketSoporte.findMany({
      orderBy: {
        fechaApertura: 'asc',
      },
      where: {
        tecnicoId: tecnicoId,
        estado: {
          in: ['ABIERTA', 'EN_PROCESO'],
        },
      },
      select: {
        id: true,
        titulo: true,
        fechaApertura: true,
        estado: true,
        prioridad: true,
        descripcion: true,
        cliente: {
          select: {
            nombre: true,
            direccion: true,
            apellidos: true,
            telefono: true,
            contactoReferenciaTelefono: true,
            ubicacion: { select: { latitud: true, longitud: true } },
          },
        },
      },
    });
    console.log('Los tickets asignados a este usuario son: ', rawTickets);

    return rawTickets
      .sort((a, b) => +a.fechaApertura - +b.fechaApertura)
      .map((t) => {
        const loc = t.cliente.ubicacion; // puede ser null
        return {
          id: t.id,
          title: t.titulo,
          openedAt: t.fechaApertura,
          status: t.estado,
          priority: t.prioridad,
          description: t.descripcion,

          clientName: `${t.cliente.nombre} ${t.cliente.apellidos}`,
          clientPhone: t.cliente.telefono,
          referenceContact: t.cliente.contactoReferenciaTelefono,
          direction: t.cliente.direccion,
          location: loc ? { lat: loc.latitud, lng: loc.longitud } : null, // o undefined si prefieres
        };
      });
  }

  async findTicketsAsignados(tecnicoId: number) {
    try {
      const user = await this.prisma.usuario.findUnique({
        where: { id: tecnicoId },
      });

      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }

      const rawTickets = await this.prisma.ticketSoporte.findMany({
        orderBy: {
          fechaAsignacion: 'asc',
        },
        where: {
          AND: [
            {
              estado: {
                in: [
                  'ABIERTA',
                  'EN_PROCESO',
                  'PENDIENTE',
                  'PENDIENTE_CLIENTE',
                  'PENDIENTE_TECNICO',
                  'NUEVO',
                  'PENDIENTE_REVISION',
                ],
              },
            },
            {
              OR: [
                { tecnicoId },
                {
                  asignaciones: {
                    some: { tecnicoId },
                  },
                },
              ],
            },
          ],
        },
        select: {
          id: true,
          titulo: true,
          fechaApertura: true,
          estado: true,
          prioridad: true,
          descripcion: true,
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              direccion: true,
              telefono: true,
              contactoReferenciaTelefono: true,
              ubicacion: { select: { latitud: true, longitud: true } },
              medias: {
                where: {
                  categoria: {
                    notIn: ['SOPORTE_TICKET'],
                  },
                },
                select: {
                  id: true,
                  cdnUrl: true,
                  creadoEn: true,
                  actualizadoEn: true,
                  titulo: true,
                  descripcion: true,
                  notas: true,
                },
              },
            },
          },
        },
      });

      const formattedTickets = rawTickets.map((t) => {
        const cliente = t.cliente;

        const loc = cliente?.ubicacion ?? null;
        const medias = (cliente?.medias ?? []).map((media) => ({
          id: media.id,
          titulo: media.titulo,
          descripcion: media.descripcion,
          notas: media.notas,
          creadoEn: media.creadoEn,
          actualizadoEn: media.actualizadoEn,
          cdnUrl: media.cdnUrl,
        }));

        return {
          id: t.id,
          titulo: t.titulo,
          abiertoEn: t.fechaApertura,
          estado: t.estado,
          prioridad: t.prioridad,
          descripcion: t.descripcion,

          clientId: cliente?.id ?? null,
          clienteNombre: cliente
            ? `${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`.trim()
            : 'SIN CLIENTE',

          clienteTel: cliente?.telefono ?? null,
          referenciaContacto: cliente?.contactoReferenciaTelefono ?? null,
          direccion: cliente?.direccion ?? null,

          ubicacionMaps: loc ? { lat: loc.latitud, lng: loc.longitud } : null,

          medias,
        };
      });

      return formattedTickets;
    } catch (error) {
      console.error('Error en findTicketsAsignados:', error);
      throwFatalError(error, this.logger, 'Dashboard -ticketAsignados');
    }
  }

  async ticketDetailsAsignado(ticketId: number) {
    try {
      const rawTicket = await this.prisma.ticketSoporte.findUnique({
        where: { id: ticketId },
        select: {
          id: true,
          titulo: true,
          fechaApertura: true,
          estado: true,
          prioridad: true,
          descripcion: true,
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              direccion: true,
              telefono: true,
              contactoReferenciaTelefono: true,
              ubicacion: { select: { latitud: true, longitud: true } },
              sector: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
              municipio: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
              departamento: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
              observaciones: true,

              medias: {
                where: {
                  categoria: {
                    notIn: ['SOPORTE_TICKET'],
                  },
                },
                select: {
                  id: true,
                  cdnUrl: true,
                  creadoEn: true,
                  actualizadoEn: true,
                  titulo: true,
                  descripcion: true,
                  notas: true,
                },
              },
            },
          },
        },
      });

      if (!rawTicket) {
        throw new NotFoundException(`Ticket con id ${ticketId} no encontrado`);
      }

      /*
       * =====================================================
       * CLIENTE
       * =====================================================
       *
       * Un TicketSoporte puede existir sin ClienteInternet.
       *
       * El listado de tickets asignados ya soporta este caso,
       * así que el detalle debe conservar el mismo contrato.
       * =====================================================
       */

      const cliente = rawTicket.cliente;

      const loc = cliente?.ubicacion ?? null;

      const medias = (cliente?.medias ?? []).map((media) => ({
        id: media.id,

        titulo: media.titulo,

        descripcion: media.descripcion,

        notas: media.notas,

        creadoEn: media.creadoEn,

        actualizadoEn: media.actualizadoEn,

        cdnUrl: media.cdnUrl,
      }));

      const clienteNombre = cliente
        ? `${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`.trim() ||
          'Cliente sin nombre'
        : 'SIN CLIENTE';

      /*
       * =====================================================
       * RESPONSE
       * =====================================================
       *
       * direccion permanece como objeto estable porque así lo
       * consume Android.
       *
       * Cuando no existe cliente o dato geográfico utilizamos
       * string vacío; la UI es quien presenta el fallback
       * "Sin dirección", "Sin sector", etc.
       * =====================================================
       */

      return {
        id: rawTicket.id,

        titulo: rawTicket.titulo,

        abiertoEn: rawTicket.fechaApertura,

        estado: rawTicket.estado,

        prioridad: rawTicket.prioridad,

        descripcion: rawTicket.descripcion,

        clientId: cliente?.id ?? null,

        clienteNombre,

        clienteTel: cliente?.telefono ?? null,

        referenciaContacto: cliente?.contactoReferenciaTelefono ?? null,

        direccion: {
          direccion: cliente?.direccion ?? '',

          sector: cliente?.sector?.nombre ?? '',

          municipio: cliente?.municipio?.nombre ?? '',
        },

        observaciones: cliente?.observaciones ?? '',

        ubicacionMaps:
          loc?.latitud != null && loc?.longitud != null
            ? {
                lat: loc.latitud,

                lng: loc.longitud,
              }
            : null,

        medias,
      };
    } catch (error) {
      console.error('Error en ticketDetailsAsignado:', error);
      throwFatalError(error, this.logger, 'Dashboard - ticketDetailsAsignado');
    }
  }

  async getDashboardData() {
    const TZ = 'America/Guatemala';
    const ahora = dayjs().tz(TZ);
    const inicioMes = ahora.startOf('month').toDate();
    const finMes = ahora.endOf('month').toDate();

    const [
      activeClientsCount,
      delinquentClientsCount,
      suspendedClientsCount,

      // Si tienes un modelo Servicio, cámbialo aquí:
      activeServicesCount,
      suspendedServicesCount,

      clientsAddedThisMonthCount,
      lastTicket,

      // Otros nuevos
      ticketsResueltosDelMes,
      clientesRegistrados,
      clientesNuevosDelMes,

      facturasEmitidas,
      facturasEmitidasDelMes,

      facturasCobradasDelMes,
      facturasCobradas,

      totalCobradoDelMesAgg,

      moraTotalAgg,
      pagosParcialesAgg,
      pendientesSinPagarAgg,
      //clientes con pago pendiente
      pendientesPago,
      atrasados,
      desinstalados,
    ] = await Promise.all([
      // Clientes por estado
      this.prisma.clienteInternet.count({
        where: {
          estadoCliente: {
            in: ['ACTIVO', 'PENDIENTE_ACTIVO', 'PAGO_PENDIENTE', 'ATRASADO'],
          },
        },
      }),
      this.prisma.clienteInternet.count({ where: { estadoCliente: 'MOROSO' } }),
      this.prisma.clienteInternet.count({
        where: { estadoCliente: 'SUSPENDIDO' },
      }),

      // Services (placeholder: ajusta si tienes otro modelo)
      this.prisma.clienteInternet.count({ where: { estadoCliente: 'ACTIVO' } }),
      this.prisma.clienteInternet.count({
        where: { estadoCliente: 'SUSPENDIDO' },
      }),

      // Clientes añadidos este mes
      this.prisma.clienteInternet.count({
        where: { creadoEn: { gte: inicioMes } },
      }),

      // Último ticket creado
      this.prisma.ticketSoporte.findFirst({
        orderBy: { fechaApertura: 'desc' },
      }),

      // Tickets resueltos en el mes (filtrado por fechaCierre)
      this.prisma.ticketSoporte.count({
        where: {
          estado: 'RESUELTA',
          fechaCierre: { gte: inicioMes, lte: finMes },
        },
      }),

      // Clientes totales registrados
      this.prisma.clienteInternet.count(),

      // Clientes nuevos (nuevamente, igual que 'clientsAddedThisMonth')
      this.prisma.clienteInternet.count({
        where: { creadoEn: { gte: inicioMes } },
      }),

      // Facturas
      this.prisma.facturaInternet.count(), // todas
      this.prisma.facturaInternet.count({
        // generadas este mes
        where: { creadoEn: { gte: inicioMes, lte: finMes } },
      }),

      // Facturas cobradas
      this.prisma.facturaInternet.count({
        where: {
          estadoFacturaInternet: 'PAGADA',
          fechaPagada: { gte: inicioMes, lte: finMes },
        },
      }),
      this.prisma.facturaInternet.count({
        where: {
          estadoFacturaInternet: 'PAGADA',
          fechaPagada: {
            gte: inicioMes,
            lte: finMes,
          },
        },
      }),

      // Suma de lo cobrado este mes
      this.prisma.facturaInternet.aggregate({
        where: {
          estadoFacturaInternet: 'PAGADA',
          fechaPagada: { gte: inicioMes, lte: finMes },
        },
        _sum: { montoPago: true },
      }),

      // Para la mora de morosos: sumamos TOTAL de factura
      this.prisma.facturaInternet.aggregate({
        where: {
          estadoFacturaInternet: { in: ['PARCIAL', 'PENDIENTE', 'VENCIDA'] },
          cliente: { estadoCliente: 'MOROSO' },
        },
        _sum: { montoPago: true },
      }),

      // Suma de pagos parciales hechos a morosos
      this.prisma.facturaInternet.aggregate({
        where: {
          estadoFacturaInternet: 'PARCIAL',
          cliente: { estadoCliente: 'MOROSO' },
        },
        _sum: { montoPago: true },
      }),

      // Suma de facturas pendientes (monto total)
      this.prisma.facturaInternet.aggregate({
        where: { estadoFacturaInternet: 'PENDIENTE' },
        _sum: { montoPago: true },
      }),

      this.prisma.clienteInternet.count({
        where: {
          estadoCliente: 'PENDIENTE_ACTIVO',
        },
      }),

      this.prisma.clienteInternet.count({
        where: {
          estadoCliente: 'ATRASADO',
        },
      }),

      this.prisma.clienteInternet.count({
        where: {
          estadoCliente: 'DESINSTALADO',
        },
      }),
    ]);

    // Extraigo y calculo las sumas finales
    const totalCobradoDelMes = totalCobradoDelMesAgg._sum.montoPago ?? 0;
    const sumaMorososTotal = moraTotalAgg._sum.montoPago ?? 0;
    const sumaPagosParciales = pagosParcialesAgg._sum.montoPago ?? 0;
    const moraDeMorososReal = sumaMorososTotal - sumaPagosParciales;
    const facturasSinPagarMonto = pendientesSinPagarAgg._sum.montoPago ?? 0;

    return {
      activeClients: activeClientsCount,
      delinquentClients: delinquentClientsCount,
      suspendedClients: suspendedClientsCount,
      activeServices: activeServicesCount,
      suspendedServices: suspendedServicesCount,
      clientsAddedThisMonth: clientsAddedThisMonthCount,
      lastTicket,
      ticketsResueltosDelMes,
      clientesRegistrados,
      clientesNuevosDelMes,
      facturasEmitidas,
      facturasEmitidasDelMes,
      facturasCobradasDelMes,
      facturasCobradas,
      totalCobradoDelMes,
      moraDeMorosos: moraDeMorososReal,
      facturasSinPagarMonto,
      pendientesPago: pendientesPago,
      atrasados: atrasados,
      desinstalados: desinstalados,
    };
  }

  /**
   * KPIs PRINCIPALES DEL DASHBOARD
   *
   * IMPORTANTE:
   *
   * estadoCliente:
   * - ACTIVO
   * - SUSPENDIDO
   * - DESINSTALADO
   * - PENDIENTE_ACTIVO
   * - EN_INSTALACION
   *
   * estadoCobranza:
   * - AL_DIA
   * - PAGO_PENDIENTE
   * - ATRASADO
   * - MOROSO
   *
   * Nunca utilizar estados de cobranza desde estadoCliente.
   */
  async dashboardData() {
    try {
      const today = dayjs().tz(TZ);

      const inicioMes = today.startOf('month');

      const inicioMesSiguiente = inicioMes.add(1, 'month');

      /**
       * ============================================================
       * CLIENTES
       * ============================================================
       *
       * Solo clientes vigentes en sistema.
       *
       * Los registros con soft-delete no deben participar en:
       * - total;
       * - estado de servicio;
       * - estado de cobranza.
       */
      const clientesWhere = {
        isEliminado: false,
      } satisfies Prisma.ClienteInternetWhereInput;

      const [
        totalEnSistema,

        clientesPorEstadoServicio,
        clientesPorEstadoCobranza,

        /**
         * ==========================================================
         * FACTURACIÓN
         * ==========================================================
         */
        facturasEmitidasMes,

        facturasPagadasMes,

        montoFacturadoMesAgg,

        montoCobradoMesAgg,

        montoPendienteMesAgg,
      ] = await Promise.all([
        /**
         * ----------------------------------------------------------
         * CLIENTES
         * ----------------------------------------------------------
         */

        this.prisma.clienteInternet.count({
          where: clientesWhere,
        }),

        /**
         * Agrupamos por estado operativo.
         *
         * Evitamos hacer 5 queries independientes.
         */
        this.prisma.clienteInternet.groupBy({
          by: ['estadoCliente'],

          where: clientesWhere,

          _count: {
            _all: true,
          },
        }),

        /**
         * Agrupamos por estado de cobranza.
         */
        this.prisma.clienteInternet.groupBy({
          by: ['estadoCobranza'],

          where: clientesWhere,

          _count: {
            _all: true,
          },
        }),

        /**
         * ----------------------------------------------------------
         * FACTURAS EMITIDAS EN EL MES
         * ----------------------------------------------------------
         */
        this.prisma.facturaInternet.count({
          where: {
            creadoEn: {
              gte: inicioMes.toDate(),
              lt: inicioMesSiguiente.toDate(),
            },
          },
        }),

        /**
         * ----------------------------------------------------------
         * FACTURAS PAGADAS DURANTE EL MES
         * ----------------------------------------------------------
         *
         * Aquí usamos fechaPagada.
         *
         * Una factura creada en agosto y pagada en septiembre
         * cuenta como pagada en septiembre.
         */
        this.prisma.facturaInternet.count({
          where: {
            estadoFacturaInternet: 'PAGADA',

            fechaPagada: {
              gte: inicioMes.toDate(),
              lt: inicioMesSiguiente.toDate(),
            },
          },
        }),

        /**
         * ----------------------------------------------------------
         * MONTO FACTURADO
         * ----------------------------------------------------------
         *
         * Importe nominal de facturas generadas en este mes.
         */
        this.prisma.facturaInternet.aggregate({
          where: {
            creadoEn: {
              gte: inicioMes.toDate(),
              lt: inicioMesSiguiente.toDate(),
            },
          },

          _sum: {
            montoPago: true,
          },
        }),

        /**
         * ----------------------------------------------------------
         * MONTO COBRADO
         * ----------------------------------------------------------
         *
         * Fuente de verdad:
         * PagoFacturaInternet.
         *
         * Esto representa dinero efectivamente registrado como
         * cobrado durante el mes, independientemente del período
         * de la factura.
         */
        this.prisma.pagoFacturaInternet.aggregate({
          where: {
            fechaPago: {
              gte: inicioMes.toDate(),
              lt: inicioMesSiguiente.toDate(),
            },
          },

          _sum: {
            montoPagado: true,
          },
        }),

        /**
         * ----------------------------------------------------------
         * SALDO PENDIENTE DE FACTURAS GENERADAS ESTE MES
         * ----------------------------------------------------------
         *
         * Se usa saldoPendiente y NO montoPago.
         *
         * Esto incluye correctamente facturas:
         * - pendientes;
         * - parcialmente pagadas.
         *
         * Las pagadas deberían aportar 0.
         */
        this.prisma.facturaInternet.aggregate({
          where: {
            creadoEn: {
              gte: inicioMes.toDate(),
              lt: inicioMesSiguiente.toDate(),
            },
          },

          _sum: {
            saldoPendiente: true,
          },
        }),
      ]);

      /**
       * ============================================================
       * NORMALIZACIÓN DE ESTADOS DE SERVICIO
       * ============================================================
       */

      const servicioCountMap = new Map(
        clientesPorEstadoServicio.map((item) => [
          item.estadoCliente,
          item._count._all,
        ]),
      );

      const activos = servicioCountMap.get('ACTIVO') ?? 0;

      const suspendidos = servicioCountMap.get('SUSPENDIDO') ?? 0;

      const desinstalados = servicioCountMap.get('DESINSTALADO') ?? 0;

      const pendientesActivacion =
        servicioCountMap.get('PENDIENTE_ACTIVO') ?? 0;

      const enInstalacion = servicioCountMap.get('EN_INSTALACION') ?? 0;

      /**
       * Cartera operacional actual.
       *
       * No incluimos DESINSTALADO.
       *
       * Tampoco usamos:
       * PAGO_PENDIENTE
       * ATRASADO
       * MOROSO
       *
       * aunque sigan existiendo temporalmente en EstadoCliente
       * por compatibilidad/migración.
       */
      const carteraActual =
        activos + suspendidos + pendientesActivacion + enInstalacion;

      /**
       * ============================================================
       * NORMALIZACIÓN DE COBRANZA
       * ============================================================
       */

      const cobranzaCountMap = new Map(
        clientesPorEstadoCobranza.map((item) => [
          item.estadoCobranza,
          item._count._all,
        ]),
      );

      const alDia = cobranzaCountMap.get('AL_DIA') ?? 0;

      const pagoPendiente = cobranzaCountMap.get('PAGO_PENDIENTE') ?? 0;

      const atrasados = cobranzaCountMap.get('ATRASADO') ?? 0;

      const morosos = cobranzaCountMap.get('MOROSO') ?? 0;

      /**
       * ============================================================
       * FACTURACIÓN
       * ============================================================
       */

      const montoFacturadoMes = montoFacturadoMesAgg._sum.montoPago ?? 0;

      const montoCobradoMes = montoCobradoMesAgg._sum.montoPagado ?? 0;

      const montoPendienteMes = montoPendienteMesAgg._sum.saldoPendiente ?? 0;

      /**
       * ============================================================
       * RESPONSE
       * ============================================================
       */

      return {
        periodo: {
          desde: inicioMes.format('YYYY-MM-DD'),
          hasta: today.format('YYYY-MM-DD'),
          zonaHoraria: TZ,
        },

        clientes: {
          resumen: {
            totalEnSistema,
            carteraActual,
          },

          servicio: {
            activos,
            suspendidos,
            pendientesActivacion,
            enInstalacion,
            desinstalados,
          },

          cobranza: {
            alDia,
            pagoPendiente,
            atrasados,
            morosos,
          },
        },

        facturacion: {
          facturasEmitidasMes,
          facturasPagadasMes,

          montoFacturadoMes,
          montoCobradoMes,
          montoPendienteMes,
        },
      };
    } catch (error) {
      throwFatalError(error, this.logger, 'Dashboard service - dashboardData');
    }
  }

  /**
   * INSTALACIONES DEL MES vs DESINSTALACIONES
   * @returns ChartSeries[]
   */
  /**
   * ACTIVIDAD DE INSTALACIONES Y DESINSTALACIONES DEL MES ACTUAL
   *
   * Fuente de verdad:
   * - ClienteInstalacion COMPLETADA -> fechaFinalizacion
   * - ClienteDesinstalacion COMPLETADA -> fechaFinalizacion
   *
   * Retorna información neutral para que el frontend decida
   * cómo representarla.
   */
  async getDashboardInstalacionesChart() {
    try {
      const today = dayjs().tz(TZ);

      const inicioMes = today.startOf('month');
      const inicioMesSiguiente = inicioMes.add(1, 'month');

      const [instalaciones, desinstalaciones] = await Promise.all([
        this.prisma.clienteInstalacion.findMany({
          where: {
            estado: 'COMPLETADA',
            fechaFinalizacion: {
              gte: inicioMes.toDate(),
              lt: inicioMesSiguiente.toDate(),
            },
          },
          select: {
            fechaFinalizacion: true,
          },
        }),

        this.prisma.clienteDesinstalacion.findMany({
          where: {
            estado: 'COMPLETADA',
            fechaFinalizacion: {
              gte: inicioMes.toDate(),
              lt: inicioMesSiguiente.toDate(),
            },
          },
          select: {
            fechaFinalizacion: true,
          },
        }),
      ]);

      const instalacionesPorDia = new Map<string, number>();
      const desinstalacionesPorDia = new Map<string, number>();

      for (const instalacion of instalaciones) {
        if (!instalacion.fechaFinalizacion) continue;

        const fecha = dayjs(instalacion.fechaFinalizacion)
          .tz(TZ)
          .format('YYYY-MM-DD');

        instalacionesPorDia.set(
          fecha,
          (instalacionesPorDia.get(fecha) ?? 0) + 1,
        );
      }

      for (const desinstalacion of desinstalaciones) {
        if (!desinstalacion.fechaFinalizacion) continue;

        const fecha = dayjs(desinstalacion.fechaFinalizacion)
          .tz(TZ)
          .format('YYYY-MM-DD');

        desinstalacionesPorDia.set(
          fecha,
          (desinstalacionesPorDia.get(fecha) ?? 0) + 1,
        );
      }

      /**
       * Para el mes actual mostramos únicamente hasta hoy.
       *
       * No tiene sentido devolver del 18 al 30 como "0",
       * porque todavía son días futuros y visualmente parecerían
       * días sin actividad.
       */
      const diasTranscurridos = today.date();

      const actividadDiaria = Array.from(
        { length: diasTranscurridos },
        (_, index) => {
          const fecha = inicioMes.add(index, 'day').format('YYYY-MM-DD');

          return {
            fecha,
            instalaciones: instalacionesPorDia.get(fecha) ?? 0,
            desinstalaciones: desinstalacionesPorDia.get(fecha) ?? 0,
          };
        },
      );

      const totalInstalaciones = instalaciones.length;
      const totalDesinstalaciones = desinstalaciones.length;

      return {
        periodo: {
          desde: inicioMes.format('YYYY-MM-DD'),
          hasta: today.format('YYYY-MM-DD'),
          zonaHoraria: TZ,
        },

        totales: {
          instalaciones: totalInstalaciones,
          desinstalaciones: totalDesinstalaciones,
          balance: totalInstalaciones - totalDesinstalaciones,
        },

        actividadDiaria,
      };
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'Dashboard service - getDashboardInstalacionesChart',
      );
    }
  }

  /**
   * DESINSTALACIONES DEL MES
   * @returns ChartSeries
   */
  async getDesInstalacionesChart() {
    try {
      const today = dayjs().tz(TZ);
      const inicioMes = today.startOf('month').toDate();
      const finMes = today.endOf('month').toDate();

      const desinstalacionesMes = await this.prisma.clienteInternet.findMany({
        where: {
          estadoCliente: 'DESINSTALADO',
          desinstaladoEn: {
            gte: inicioMes,
            lte: finMes,
          },
        },
        select: {
          desinstaladoEn: true,
        },
      });

      const countsMap = desinstalacionesMes.reduce(
        (acc, item) => {
          const fechaKey = dayjs(item.desinstaladoEn)
            .tz(TZ)
            .format('YYYY-MM-DD');
          acc[fechaKey] = (acc[fechaKey] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const chartData = Object.entries(countsMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([dateIso, count]) => ({
          x: dayjs(dateIso).format('DD/MM'),
          y: count,
        }));

      return {
        id: 'Desinstalaciones',
        data: chartData,
      };
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'Dashboard service -desinstalacionesMes',
      );
    }
  }

  /**
   * INSTALACIONES DEL MES
   * @returns ChartSeries
   */
  async getInstalacionesChart() {
    try {
      const today = dayjs().tz(TZ);
      const inicioMes = today.startOf('month').toDate();
      const finMes = today.endOf('month').toDate();

      const instalacionesMes = await this.prisma.clienteInternet.findMany({
        where: {
          creadoEn: {
            gte: inicioMes,
            lte: finMes,
          },
        },
        select: {
          creadoEn: true,
        },
      });

      const countsMap = instalacionesMes.reduce(
        (acc, item) => {
          const fechaKey = dayjs(item.creadoEn).tz(TZ).format('YYYY-MM-DD');
          acc[fechaKey] = (acc[fechaKey] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const chartData = Object.entries(countsMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([dateIso, count]) => ({
          x: dayjs(dateIso).format('DD/MM'),
          y: count,
        }));

      return {
        id: 'Instalaciones',
        data: chartData,
      };
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'Dashboard service -getDashboardData',
      );
    }
  }

  /**
   * ACTIVIDAD HISTÓRICA DE INSTALACIONES Y DESINSTALACIONES
   *
   * Ventana móvil de los últimos 12 meses, incluyendo el actual.
   *
   * Fuente de verdad:
   * - ClienteInstalacion COMPLETADA -> fechaFinalizacion
   * - ClienteDesinstalacion COMPLETADA -> fechaFinalizacion
   */
  async getDashboardInstalacionesHistoricasChart() {
    try {
      const today = dayjs().tz(TZ);

      const inicioMesActual = today.startOf('month');

      // Mes actual + 11 anteriores = 12 meses.
      const inicioPeriodo = inicioMesActual.subtract(11, 'month');

      // Rango semiabierto: [inicioPeriodo, inicioMesSiguiente)
      const finPeriodoExclusivo = inicioMesActual.add(1, 'month');

      const [instalaciones, desinstalaciones] = await Promise.all([
        this.prisma.clienteInstalacion.findMany({
          where: {
            estado: 'COMPLETADA',
            fechaFinalizacion: {
              gte: inicioPeriodo.toDate(),
              lt: finPeriodoExclusivo.toDate(),
            },
          },
          select: {
            fechaFinalizacion: true,
          },
        }),

        this.prisma.clienteDesinstalacion.findMany({
          where: {
            estado: 'COMPLETADA',
            fechaFinalizacion: {
              gte: inicioPeriodo.toDate(),
              lt: finPeriodoExclusivo.toDate(),
            },
          },
          select: {
            fechaFinalizacion: true,
          },
        }),
      ]);

      const instalacionesPorMes = new Map<string, number>();
      const desinstalacionesPorMes = new Map<string, number>();

      for (const instalacion of instalaciones) {
        if (!instalacion.fechaFinalizacion) continue;

        const mes = dayjs(instalacion.fechaFinalizacion)
          .tz(TZ)
          .format('YYYY-MM');

        instalacionesPorMes.set(mes, (instalacionesPorMes.get(mes) ?? 0) + 1);
      }

      for (const desinstalacion of desinstalaciones) {
        if (!desinstalacion.fechaFinalizacion) continue;

        const mes = dayjs(desinstalacion.fechaFinalizacion)
          .tz(TZ)
          .format('YYYY-MM');

        desinstalacionesPorMes.set(
          mes,
          (desinstalacionesPorMes.get(mes) ?? 0) + 1,
        );
      }

      /**
       * Construimos siempre los 12 meses.
       * Si un mes no tuvo actividad, aparecerá con 0.
       */
      const actividadMensual = Array.from({ length: 12 }, (_, index) => {
        const mes = inicioPeriodo.add(index, 'month').format('YYYY-MM');

        const instalacionesMes = instalacionesPorMes.get(mes) ?? 0;
        const desinstalacionesMes = desinstalacionesPorMes.get(mes) ?? 0;

        return {
          mes,
          instalaciones: instalacionesMes,
          desinstalaciones: desinstalacionesMes,
          balance: instalacionesMes - desinstalacionesMes,
        };
      });

      const totalInstalaciones = instalaciones.length;
      const totalDesinstalaciones = desinstalaciones.length;

      return {
        periodo: {
          desde: inicioPeriodo.format('YYYY-MM-DD'),
          hasta: today.format('YYYY-MM-DD'),
          meses: 12,
          zonaHoraria: TZ,
        },

        totales: {
          instalaciones: totalInstalaciones,
          desinstalaciones: totalDesinstalaciones,
          balance: totalInstalaciones - totalDesinstalaciones,

          promedioInstalacionesMes: Number(
            (totalInstalaciones / 12).toFixed(2),
          ),

          promedioDesinstalacionesMes: Number(
            (totalDesinstalaciones / 12).toFixed(2),
          ),
        },

        actividadMensual,
      };
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'Dashboard service - getDashboardInstalacionesHistoricasChart',
      );
    }
  }

  /**
   * Obtiene los tickets en proceso y el conteo de tickets activos.
   * @returns Objeto con métricas y lista de tickets formateada.
   */
  async getDashboardTicketProceso() {
    try {
      // OPTIMIZACIÓN: Ejecutamos ambas consultas en paralelo para mayor velocidad
      const [ticketsProceso, ticketDisponibles] = await Promise.all([
        this.prisma.ticketSoporte.findMany({
          orderBy: {
            actualizadoEn: 'desc',
          },
          where: {
            estado: 'EN_PROCESO',
          },
          select: {
            id: true,
            titulo: true,
            cliente: {
              select: {
                id: true,
                nombre: true,
              },
            },
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
          },
        }),
        this.prisma.ticketSoporte.count({
          where: {
            estado: {
              notIn: ['RESUELTA'],
            },
          },
        }),
      ]);

      // MAPEO SEGURO: Evita crasheos si cliente, tecnico o asignaciones son null
      const formatted = ticketsProceso.map((t) => ({
        id: t.id,
        titulo: t.titulo,
        cliente: t.cliente?.nombre ?? 'General / Sin Cliente', // <-- Aquí está la magia anti-crasheo
        tecnico: t.tecnico?.nombre ?? 'Sin Asignar',
        acompanantes:
          t.asignaciones?.map((a) => a.tecnico?.nombre).filter(Boolean) ?? [],
      }));

      return {
        tickets: formatted,
        ticketsMetricas: {
          enLinea: ticketDisponibles,
        },
      };
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'Dashboard service - getDashboardTicketProceso',
      );
    }
  }

  /**
   * MOROSOS Y RUTAS COBRO
   */
  async getTopMorososDashboard() {
    try {
      const topMorososRaw = await this.prisma.facturaInternet.groupBy({
        by: ['clienteId'],
        where: {
          estadoFacturaInternet: {
            in: ['PENDIENTE', 'VENCIDA', 'PARCIAL'],
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      });

      const clienteIds = topMorososRaw
        .map((factura) => factura.clienteId)
        .filter((id): id is number => typeof id === 'number');

      const clientes = await this.prisma.clienteInternet.findMany({
        where: {
          id: {
            in: clienteIds,
          },
        },
        select: {
          id: true,
          nombre: true,
          apellidos: true,
        },
      });

      const clientesById = new Map(
        clientes.map((cliente) => [cliente.id, cliente]),
      );

      const formatted = topMorososRaw.map((item) => {
        const cliente = clientesById.get(item.clienteId);

        if (!cliente) {
          return {
            id: item.clienteId,
            nombre: `Cliente #${item.clienteId}`,
            cantidad: item._count.id,
          };
        }

        const nombreCompleto = `${cliente.nombre ?? ''} ${
          cliente.apellidos ?? ''
        }`.trim();

        return {
          id: cliente.id,
          nombre: nombreCompleto || `Cliente #${cliente.id}`,
          cantidad: item._count.id,
        };
      });

      const rutasActualesAbiertas = await this.prisma.ruta.findMany({
        where: {
          estadoRuta: {
            in: ['ACTIVO', 'ASIGNADA', 'EN_CURSO'],
          },
        },
        orderBy: {
          actualizadoEn: 'desc',
        },
        take: 10,
        select: {
          id: true,
          nombreRuta: true,
          cobrador: {
            select: {
              id: true,
              nombre: true,
            },
          },
          clientes: {
            select: {
              id: true,
            },
          },
        },
      });

      const rutasFormatted = rutasActualesAbiertas.map((ruta) => {
        return {
          nombreRuta: ruta.nombreRuta || `Ruta #${ruta.id}`,
          cobrador: ruta.cobrador?.nombre ?? 'Sin cobrador',
          totalClientes: ruta.clientes?.length ?? 0,
        };
      });

      return {
        rutasActiva: rutasFormatted,
        morosoTop: formatted,
      };
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'Dashboard service -getTopMorososDashboard',
      );
    }
  }

  /**
   * ACTIVIDAD HISTÓRICA / RECIENTE DE SOPORTE
   *
   * Permite analizar:
   * - Tickets creados.
   * - Tickets resueltos.
   * - Prioridades.
   * - Backlog actual.
   * - Tiempos medios.
   * - Comparación contra período anterior.
   *
   * Presets:
   * - 7D
   * - 30D
   * - 12M
   * - HISTORICO
   * - CUSTOM
   */
  async getDashboardTicketsActividad(query: DashboardTicketsActividadQueryDto) {
    try {
      const now = dayjs().tz(TZ);

      /**
       * ============================================================
       * 1. RANGO
       * ============================================================
       */

      let primerTicketFecha: Date | null = null;

      if (query.preset === DashboardTicketsPreset.HISTORICO) {
        const primerTicket = await this.prisma.ticketSoporte.findFirst({
          orderBy: {
            fechaApertura: 'asc',
          },
          select: {
            fechaApertura: true,
          },
        });

        primerTicketFecha = primerTicket?.fechaApertura ?? null;
      }

      const rango = resolveTicketsActivityRange({
        query,
        now,
        primerTicketFecha,
      });

      /**
       * Para comparación necesitamos consultar también el
       * período inmediatamente anterior.
       */
      const inicioConsulta = rango.comparacion?.desde ?? rango.desde;

      /**
       * ============================================================
       * 2. CONSULTAS
       * ============================================================
       */

      const resolvedRangeWhere = {
        OR: [
          {
            fechaResolucionTecnico: {
              gte: inicioConsulta.toDate(),
              lt: rango.hastaExclusivo.toDate(),
            },
          },
          {
            fechaCierre: {
              gte: inicioConsulta.toDate(),
              lt: rango.hastaExclusivo.toDate(),
            },
          },
          {
            asignaciones: {
              some: {
                resolvioEn: {
                  gte: inicioConsulta.toDate(),
                  lt: rango.hastaExclusivo.toDate(),
                },
              },
            },
          },
        ],
      } satisfies Prisma.TicketSoporteWhereInput;

      const [
        ticketsCreadosCandidatos,
        ticketsResueltosCandidatos,
        ticketsPendientes,
      ] = await Promise.all([
        /**
         * Tickets abiertos durante el período actual +
         * período anterior cuando existe comparativa.
         */
        this.prisma.ticketSoporte.findMany({
          where: {
            fechaApertura: {
              gte: inicioConsulta.toDate(),
              lt: rango.hastaExclusivo.toDate(),
            },
          },

          select: {
            id: true,
            fechaApertura: true,
            prioridad: true,
          },
        }),

        /**
         * Tickets resueltos.
         *
         * IMPORTANTE:
         * La consulta obtiene candidatos. Luego usamos
         * getTicketResolutionDate() para determinar UNA sola
         * fecha efectiva de resolución.
         */
        this.prisma.ticketSoporte.findMany({
          where: {
            estado: {
              in: TICKET_ESTADOS_RESUELTOS,
            },

            AND: [resolvedRangeWhere],
          },

          select: {
            id: true,

            prioridad: true,

            fechaApertura: true,
            fechaInicioAtencion: true,
            fechaResolucionTecnico: true,
            fechaCierre: true,

            asignaciones: {
              where: {
                resolvioEn: {
                  not: null,
                },
              },

              orderBy: {
                resolvioEn: 'desc',
              },

              take: 1,

              select: {
                resolvioEn: true,
              },
            },
          },
        }),

        /**
         * Backlog ACTUAL.
         *
         * No depende del preset porque representa el estado
         * actual del departamento de soporte.
         */
        this.prisma.ticketSoporte.findMany({
          where: {
            estado: {
              notIn: TICKET_ESTADOS_TERMINALES,
            },
          },

          select: {
            id: true,
            prioridad: true,
            fechaApertura: true,
          },
        }),
      ]);

      /**
       * ============================================================
       * 3. NORMALIZAR RESOLUCIONES
       * ============================================================
       */

      const ticketsResueltosNormalizados = ticketsResueltosCandidatos
        .map((ticket) => ({
          ...ticket,

          fechaResolucion: getTicketResolutionDate(ticket),
        }))
        .filter(
          (
            ticket,
          ): ticket is typeof ticket & {
            fechaResolucion: Date;
          } => Boolean(ticket.fechaResolucion),
        );

      /**
       * ============================================================
       * 4. SEPARAR PERÍODO ACTUAL
       * ============================================================
       */

      const ticketsCreadosActual = ticketsCreadosCandidatos.filter((ticket) =>
        isDateInsideRange(
          ticket.fechaApertura,
          rango.desde.toDate(),
          rango.hastaExclusivo.toDate(),
        ),
      );

      const ticketsResueltosActual = ticketsResueltosNormalizados.filter(
        (ticket) =>
          isDateInsideRange(
            ticket.fechaResolucion,
            rango.desde.toDate(),
            rango.hastaExclusivo.toDate(),
          ),
      );

      /**
       * ============================================================
       * 5. PERÍODO ANTERIOR
       * ============================================================
       */

      const ticketsCreadosAnterior = rango.comparacion
        ? ticketsCreadosCandidatos.filter((ticket) =>
            isDateInsideRange(
              ticket.fechaApertura,
              rango.comparacion!.desde.toDate(),
              rango.comparacion!.hastaExclusivo.toDate(),
            ),
          )
        : [];

      const ticketsResueltosAnterior = rango.comparacion
        ? ticketsResueltosNormalizados.filter((ticket) =>
            isDateInsideRange(
              ticket.fechaResolucion,
              rango.comparacion!.desde.toDate(),
              rango.comparacion!.hastaExclusivo.toDate(),
            ),
          )
        : [];

      /**
       * ============================================================
       * 6. ACTIVIDAD DEL CHART
       * ============================================================
       */

      const actividad = buildTicketsActivity({
        desde: rango.desde,
        hastaExclusivo: rango.hastaExclusivo,
        granularidad: rango.granularidad,
      });

      const actividadMap = new Map(
        actividad.map((item) => [item.periodo, item]),
      );

      for (const ticket of ticketsCreadosActual) {
        const periodo = getTicketsActivityKey(
          ticket.fechaApertura,
          rango.granularidad,
        );

        const item = actividadMap.get(periodo);

        if (!item) continue;

        item.creados += 1;

        item.prioridades.creados[ticket.prioridad] += 1;
      }

      for (const ticket of ticketsResueltosActual) {
        const periodo = getTicketsActivityKey(
          ticket.fechaResolucion,
          rango.granularidad,
        );

        const item = actividadMap.get(periodo);

        if (!item) continue;

        item.resueltos += 1;

        item.prioridades.resueltos[ticket.prioridad] += 1;
      }

      /**
       * ============================================================
       * 7. PRIORIDADES DEL PERÍODO
       * ============================================================
       */

      const prioridadesCreados = createEmptyPriorityCounter();

      const prioridadesResueltos = createEmptyPriorityCounter();

      const prioridadesPendientes = createEmptyPriorityCounter();

      for (const ticket of ticketsCreadosActual) {
        prioridadesCreados[ticket.prioridad] += 1;
      }

      for (const ticket of ticketsResueltosActual) {
        prioridadesResueltos[ticket.prioridad] += 1;
      }

      for (const ticket of ticketsPendientes) {
        prioridadesPendientes[ticket.prioridad] += 1;
      }

      /**
       * ============================================================
       * 8. TIEMPOS
       * ============================================================
       */

      const tiemposResolucion = ticketsResueltosActual
        .map((ticket) =>
          getMinutesBetween(ticket.fechaApertura, ticket.fechaResolucion),
        )
        .filter(isFiniteNumber);

      const tiemposPrimeraAtencion = ticketsResueltosActual
        .map((ticket) =>
          getMinutesBetween(ticket.fechaApertura, ticket.fechaInicioAtencion),
        )
        .filter(isFiniteNumber);

      /**
       * ============================================================
       * 9. BACKLOG
       * ============================================================
       */

      const hace48Horas = now.subtract(48, 'hour').toDate();

      const pendientesMas48Horas = ticketsPendientes.filter(
        (ticket) => ticket.fechaApertura < hace48Horas,
      ).length;

      const urgentesPendientes =
        prioridadesPendientes[PrioridadTicketSoporte.URGENTE];

      const altosPendientes =
        prioridadesPendientes[PrioridadTicketSoporte.ALTA];

      /**
       * ============================================================
       * 10. COMPARATIVA
       * ============================================================
       */

      const comparativa = rango.comparacion
        ? {
            periodoAnterior: {
              desde: rango.comparacion.desde.format('YYYY-MM-DD'),

              hasta: rango.comparacion.hastaExclusivo
                .subtract(1, 'day')
                .format('YYYY-MM-DD'),
            },

            creados: {
              actual: ticketsCreadosActual.length,

              anterior: ticketsCreadosAnterior.length,

              variacionPorcentaje: calculatePercentageVariation(
                ticketsCreadosActual.length,
                ticketsCreadosAnterior.length,
              ),
            },

            resueltos: {
              actual: ticketsResueltosActual.length,

              anterior: ticketsResueltosAnterior.length,

              variacionPorcentaje: calculatePercentageVariation(
                ticketsResueltosActual.length,
                ticketsResueltosAnterior.length,
              ),
            },
          }
        : null;

      /**
       * ============================================================
       * RESPONSE
       * ============================================================
       */

      return {
        periodo: {
          preset: rango.preset,

          desde: rango.desde.format('YYYY-MM-DD'),

          hasta: rango.hastaExclusivo.subtract(1, 'day').format('YYYY-MM-DD'),

          granularidad: rango.granularidad,

          puntos: actividad.length,

          zonaHoraria: TZ,
        },

        resumen: {
          creados: ticketsCreadosActual.length,

          resueltos: ticketsResueltosActual.length,

          pendientesActuales: ticketsPendientes.length,

          urgentesPendientes,

          altosPendientes,

          pendientesMas48Horas,
        },

        tiempos: {
          promedioResolucionMinutos: average(tiemposResolucion),

          promedioPrimeraAtencionMinutos: average(tiemposPrimeraAtencion),
        },

        prioridades: {
          creadosPeriodo: prioridadesCreados,

          resueltosPeriodo: prioridadesResueltos,

          pendientesActuales: prioridadesPendientes,
        },

        comparativa,

        actividad,
      };
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'Dashboard service - getDashboardTicketsActividad',
      );
    }
  }

  // HELPERS
}

// HELPERS
type TicketsActivityRangeInput = {
  query: DashboardTicketsActividadQueryDto;

  now: ReturnType<typeof dayjs>;

  primerTicketFecha: Date | null;
};

function resolveTicketsActivityRange({
  query,
  now,
  primerTicketFecha,
}: TicketsActivityRangeInput) {
  const preset = query.preset ?? DashboardTicketsPreset.ULTIMOS_7_DIAS;

  const hoy = now.startOf('day');

  const manana = hoy.add(1, 'day');

  let desde: ReturnType<typeof dayjs>;
  let hastaExclusivo: ReturnType<typeof dayjs>;

  let granularidad: TicketsGranularidad;

  switch (preset) {
    case DashboardTicketsPreset.ULTIMOS_7_DIAS: {
      desde = hoy.subtract(6, 'day');
      hastaExclusivo = manana;

      granularidad = 'DIA';

      break;
    }

    case DashboardTicketsPreset.ULTIMOS_30_DIAS: {
      desde = hoy.subtract(29, 'day');
      hastaExclusivo = manana;

      granularidad = 'DIA';

      break;
    }

    case DashboardTicketsPreset.ULTIMOS_12_MESES: {
      desde = hoy.startOf('month').subtract(11, 'month');

      /**
       * No devolvemos días futuros del mes actual.
       */
      hastaExclusivo = manana;

      granularidad = 'MES';

      break;
    }

    case DashboardTicketsPreset.HISTORICO: {
      desde = primerTicketFecha
        ? dayjs(primerTicketFecha).tz(TZ).startOf('day')
        : hoy;

      hastaExclusivo = manana;

      granularidad = inferTicketsGranularity(desde, hastaExclusivo);

      break;
    }

    case DashboardTicketsPreset.PERSONALIZADO: {
      if (!query.desde || !query.hasta) {
        throw new BadRequestException(
          'Los parámetros desde y hasta son requeridos para preset=CUSTOM.',
        );
      }

      desde = dayjs.tz(query.desde, TZ).startOf('day');

      const hasta = dayjs.tz(query.hasta, TZ).startOf('day');

      if (!desde.isValid() || !hasta.isValid()) {
        throw new BadRequestException('El rango de fechas no es válido.');
      }

      if (desde.isAfter(hasta)) {
        throw new BadRequestException(
          'La fecha desde no puede ser posterior a hasta.',
        );
      }

      if (hasta.isAfter(hoy)) {
        throw new BadRequestException(
          'La fecha hasta no puede ser posterior a hoy.',
        );
      }

      hastaExclusivo = hasta.add(1, 'day');

      granularidad = inferTicketsGranularity(desde, hastaExclusivo);

      break;
    }

    default: {
      throw new BadRequestException(
        'Preset de actividad de tickets no válido.',
      );
    }
  }

  /**
   * HISTORICO no tiene período anterior comparable.
   */
  if (preset === DashboardTicketsPreset.HISTORICO) {
    return {
      preset,
      desde,
      hastaExclusivo,
      granularidad,
      comparacion: null,
    };
  }

  /**
   * Para 12M conservamos exactamente el mismo rango
   * desplazado un año.
   */
  if (preset === DashboardTicketsPreset.ULTIMOS_12_MESES) {
    return {
      preset,
      desde,
      hastaExclusivo,
      granularidad,

      comparacion: {
        desde: desde.subtract(12, 'month'),

        hastaExclusivo: hastaExclusivo.subtract(12, 'month'),
      },
    };
  }

  /**
   * 7D, 30D y CUSTOM:
   *
   * se compara contra un rango inmediatamente anterior
   * de la misma cantidad de días.
   */
  const dias = hastaExclusivo.diff(desde, 'day');

  return {
    preset,
    desde,
    hastaExclusivo,
    granularidad,

    comparacion: {
      desde: desde.subtract(dias, 'day'),

      hastaExclusivo: desde,
    },
  };
}

function inferTicketsGranularity(
  desde: ReturnType<typeof dayjs>,
  hastaExclusivo: ReturnType<typeof dayjs>,
): TicketsGranularidad {
  const dias = hastaExclusivo.diff(desde, 'day');

  /**
   * Hasta 45 puntos diarios.
   */
  if (dias <= 45) {
    return 'DIA';
  }

  /**
   * Hasta aproximadamente 2 años:
   * puntos mensuales.
   */
  if (dias <= 730) {
    return 'MES';
  }

  /**
   * Hasta 5 años:
   * puntos trimestrales.
   */
  if (dias <= 1825) {
    return 'TRIMESTRE';
  }

  return 'ANIO';
}

function buildTicketsActivity({
  desde,
  hastaExclusivo,
  granularidad,
}: {
  desde: ReturnType<typeof dayjs>;
  hastaExclusivo: ReturnType<typeof dayjs>;
  granularidad: TicketsGranularidad;
}): TicketsActividadPoint[] {
  const result: TicketsActividadPoint[] = [];

  let cursor = getBucketStart(desde, granularidad);

  while (cursor.isBefore(hastaExclusivo)) {
    result.push({
      periodo: getTicketsActivityKey(cursor.toDate(), granularidad),

      creados: 0,
      resueltos: 0,

      prioridades: {
        creados: createEmptyPriorityCounter(),

        resueltos: createEmptyPriorityCounter(),
      },
    });

    cursor = incrementBucket(cursor, granularidad);
  }

  return result;
}

function getTicketsActivityKey(date: Date, granularidad: TicketsGranularidad) {
  const value = dayjs(date).tz(TZ);

  switch (granularidad) {
    case 'DIA':
      return value.format('YYYY-MM-DD');

    case 'MES':
      return value.format('YYYY-MM');

    case 'TRIMESTRE': {
      const trimestre = Math.floor(value.month() / 3) + 1;

      return `${value.year()}-Q${trimestre}`;
    }

    case 'ANIO':
      return String(value.year());
  }
}

function getBucketStart(
  date: ReturnType<typeof dayjs>,
  granularidad: TicketsGranularidad,
) {
  switch (granularidad) {
    case 'DIA':
      return date.startOf('day');

    case 'MES':
      return date.startOf('month');

    case 'TRIMESTRE': {
      const firstMonth = Math.floor(date.month() / 3) * 3;

      return date.month(firstMonth).startOf('month');
    }

    case 'ANIO':
      return date.startOf('year');
  }
}

function incrementBucket(
  date: ReturnType<typeof dayjs>,
  granularidad: TicketsGranularidad,
) {
  switch (granularidad) {
    case 'DIA':
      return date.add(1, 'day');

    case 'MES':
      return date.add(1, 'month');

    case 'TRIMESTRE':
      return date.add(3, 'month');

    case 'ANIO':
      return date.add(1, 'year');
  }
}

function createEmptyPriorityCounter(): TicketsPrioridadCount {
  return {
    [PrioridadTicketSoporte.BAJA]: 0,
    [PrioridadTicketSoporte.MEDIA]: 0,
    [PrioridadTicketSoporte.ALTA]: 0,
    [PrioridadTicketSoporte.URGENTE]: 0,
  };
}

function isDateInsideRange(date: Date, desde: Date, hastaExclusivo: Date) {
  const time = date.getTime();

  return time >= desde.getTime() && time < hastaExclusivo.getTime();
}

function calculatePercentageVariation(
  actual: number,
  anterior: number,
): number | null {
  /**
   * No podemos calcular porcentaje cuando el período
   * anterior era 0.
   *
   * Si ambos son cero, sí podemos expresar 0% de cambio.
   */
  if (anterior === 0) {
    return actual === 0 ? 0 : null;
  }

  return round(((actual - anterior) / anterior) * 100, 2);
}
