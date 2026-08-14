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
import { EstadoTicketSoporte, Prisma } from '@prisma/client';
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

      const loc = rawTicket.cliente.ubicacion;
      const medias = (rawTicket.cliente.medias ?? []).map((media) => ({
        id: media.id,
        titulo: media.titulo,
        descripcion: media.descripcion,
        notas: media.notas,
        creadoEn: media.creadoEn,
        actualizadoEn: media.actualizadoEn,
        cdnUrl: media.cdnUrl,
      }));

      // 👇 misma estructura que en findTicketsAsignados, pero para 1 ticket
      return {
        id: rawTicket.id,
        titulo: rawTicket.titulo,
        abiertoEn: rawTicket.fechaApertura,
        estado: rawTicket.estado,
        prioridad: rawTicket.prioridad,
        descripcion: rawTicket.descripcion,
        clientId: rawTicket.cliente.id,
        clienteNombre:
          `${rawTicket.cliente.nombre ?? ''} ${rawTicket.cliente.apellidos ?? ''}`.trim(),
        clienteTel: rawTicket.cliente.telefono,
        referenciaContacto: rawTicket.cliente.contactoReferenciaTelefono,
        direccion: {
          direccion: rawTicket.cliente.direccion ?? 'N/A',
          sector: rawTicket.cliente.sector.nombre ?? 'N/A',
          municipio: rawTicket.cliente.municipio.nombre ?? 'N/A',
        },
        observaciones: rawTicket.cliente.observaciones ?? 'N/A',
        ubicacionMaps: loc ? { lat: loc.latitud, lng: loc.longitud } : null,
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
   * GET DE KPIS PARA DASHBOARD
   */
  async dashboardData() {
    try {
      const today = dayjs().tz(TZ);
      const inicioMes = today.startOf('month').toDate();
      const finMes = today.endOf('month').toDate();

      // CLIENTES POR ESTADO
      const [
        enSistema,
        alDia,
        suspendidos,
        desinstalados,
        pendienteActivo,
        morosos,
      ] = await Promise.all([
        this.prisma.clienteInternet.count(),
        this.prisma.clienteInternet.count({
          where: { estadoCliente: 'ACTIVO' },
        }),
        this.prisma.clienteInternet.count({
          where: { estadoCliente: 'SUSPENDIDO' },
        }),
        this.prisma.clienteInternet.count({
          where: { estadoCliente: 'DESINSTALADO' },
        }),
        this.prisma.clienteInternet.count({
          where: { estadoCliente: 'PENDIENTE_ACTIVO' },
        }),
        this.prisma.clienteInternet.count({
          where: { estadoCliente: 'MOROSO' },
        }),
      ]);

      // FACTURACION
      const [
        fEmitidasMes, //emisiones del mes
        fPagadasMes, //creadas el mes, y ya están pagadas
        fTotalGeneradas, //generadas del mes, y la suma total de esas facturas
        fTotalPagadas, // Suma total de facturas pagadas del mes, generadas del mes
        fGeneradasSinPagar, // suma total de facturas monto sin pagar aun, del mes
      ] = await Promise.all([
        this.prisma.facturaInternet.count({
          where: {
            creadoEn: {
              gte: inicioMes,
              lte: finMes,
            },
          },
        }),

        this.prisma.facturaInternet.count({
          where: {
            creadoEn: {
              gte: inicioMes,
              lte: finMes,
            },
            estadoFacturaInternet: 'PAGADA',
          },
        }),

        this.prisma.facturaInternet.aggregate({
          where: {
            creadoEn: {
              gte: inicioMes,
              lte: finMes,
            },
          },
          _sum: {
            montoPago: true,
          },
        }),

        this.prisma.facturaInternet.aggregate({
          where: {
            creadoEn: {
              gte: inicioMes,
              lte: finMes,
            },
            estadoFacturaInternet: 'PAGADA',
          },
          _sum: {
            montoPago: true,
          },
        }),

        this.prisma.facturaInternet.aggregate({
          where: {
            creadoEn: {
              gte: inicioMes,
              lte: finMes,
            },
            estadoFacturaInternet: 'PENDIENTE',
          },
          _sum: {
            montoPago: true,
          },
        }),
      ]);

      const data = {
        clientes: {
          totalEnSistema: enSistema,
          activos: alDia,
          suspendidos,
          desinstalados,
          pendientesActivacion: pendienteActivo,
          morosos,
        },
        facturacion: {
          facturasEmitidasMes: fEmitidasMes,
          facturasPagadasMes: fPagadasMes,
          montoFacturadoMes: fTotalGeneradas._sum.montoPago ?? 0,
          montoCobradoMes: fTotalPagadas._sum.montoPago ?? 0,
          montoPendienteMes: fGeneradasSinPagar._sum.montoPago ?? 0,
        },
      };

      return data;
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'Dashboard service -getDashboardData',
      );
    }
  }

  /**
   * INSTALACIONES DEL MES vs DESINSTALACIONES
   * @returns ChartSeries[]
   */
  async getDashboardInstalacionesChart() {
    try {
      const [instalaciones, desinstalaciones] = await Promise.all([
        this.getInstalacionesChart(),
        this.getDesInstalacionesChart(),
      ]);

      // Esto ahora sí es ChartDataLineNivo (ChartSeries[])
      return [instalaciones, desinstalaciones];
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'Dashboard service -getDashboardData',
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
   * HISTÓRICO DE INSTALACIONES POR MES (AÑO ACTUAL)
   * Formato para Nivo Bar:
   *   { label: '2025-01', instalaciones: 10 }
   */
  async getDashboardInstalacionesHistoricasChart() {
    try {
      type InstalacionesHistoricasBarPoint = {
        label: string; // ej: "2025-01"
        instalaciones: number;
      };

      const today = dayjs().tz(TZ);
      const inicioAnio = today.startOf('year').toDate();
      const finAnio = today.endOf('year').toDate();

      const instalacionesAnio = await this.prisma.clienteInternet.findMany({
        where: {
          creadoEn: {
            gte: inicioAnio,
            lte: finAnio,
          },
        },
        select: {
          creadoEn: true,
        },
      });

      // 1. Conteos por mes
      const countsMap = instalacionesAnio.reduce(
        (acc, item) => {
          const fechaKey = dayjs(item.creadoEn).tz(TZ).format('YYYY-MM');
          acc[fechaKey] = (acc[fechaKey] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // 2. Pasar a entries y ordenar por mes
      const entriesOrdenadas = Object.entries(countsMap).sort(([a], [b]) =>
        a.localeCompare(b),
      );

      // 3. Omitir el primer mes (el más antiguo)
      const [, ...entriesSinPrimerMes] = entriesOrdenadas;

      // 4. Construir el chartData
      const chartData: InstalacionesHistoricasBarPoint[] =
        entriesSinPrimerMes.map(([yearMonth, count]) => ({
          label: yearMonth, // ej: "2025-04"
          instalaciones: count,
        }));

      return chartData;
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'Dashboard service -getDashboardInstalacionesHistoricasChart',
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
}
