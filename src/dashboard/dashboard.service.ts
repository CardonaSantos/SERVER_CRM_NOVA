import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { PrismaService } from 'src/prisma/prisma.service';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { TZ } from 'src/Utils/tzgt';
dayjs.extend(utc);
dayjs.extend(timezone);
@Injectable()
export class DashboardService {
  private logger = new Logger(DashboardService.name);
  constructor(private readonly prisma: PrismaService) {}

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
        const loc = t.cliente.ubicacion;
        const medias = (t.cliente.medias ?? []).map((media) => ({
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
          clientId: t.cliente.id,
          clienteNombre:
            `${t.cliente.nombre ?? ''} ${t.cliente.apellidos ?? ''}`.trim(),
          clienteTel: t.cliente.telefono,
          referenciaContacto: t.cliente.contactoReferenciaTelefono,
          direccion: t.cliente.direccion,
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
        fEmitidasMes,
        fPagadasMes,
        fTotalGeneradas,
        fTotalPagadas,
        fGeneradasSinPagar,
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

      const countsMap = instalacionesAnio.reduce(
        (acc, item) => {
          const fechaKey = dayjs(item.creadoEn).tz(TZ).format('YYYY-MM');
          acc[fechaKey] = (acc[fechaKey] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const chartData: InstalacionesHistoricasBarPoint[] = Object.entries(
        countsMap,
      )
        .sort(([a], [b]) => a.localeCompare(b)) // orden cronológico por YYYY-MM
        .map(([yearMonth, count]) => ({
          label: yearMonth, // ej: "2025-01"
          instalaciones: count, // ej: 12
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
   * RETORNO DE DATOS SIN
   * @returns
   */
  async getDashboardTicketProceso() {
    try {
      const ticketsProceso = await this.prisma.ticketSoporte.findMany({
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
      });

      const ticketDisponibles = await this.prisma.ticketSoporte.count({
        where: {
          estado: {
            notIn: ['RESUELTA'],
          },
        },
      });

      // En tu getDashboardTicketProceso dentro del map:

      const formatted = ticketsProceso.map((t) => {
        const ticket = {
          id: t.id,
          titulo: t.titulo,
          cliente: t.cliente.nombre,
          tecnico: t.tecnico ? t.tecnico.nombre : null,
          acompanantes: t.asignaciones.map((a) => a.tecnico.nombre),
        };

        return ticket;
      });

      const objt = {
        tickets: formatted,
        ticketsMetricas: {
          enLinea: ticketDisponibles ?? 0,
        },
      };

      return objt;
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'Dashboard service -getDashboardTicketProceso',
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

      const clientes = await this.prisma.clienteInternet.findMany({
        where: {
          id: {
            in: topMorososRaw.map((f) => f.clienteId),
          },
        },
        select: {
          id: true,
          nombre: true,
          apellidos: true,
        },
      });

      const formatted = topMorososRaw.map((c) => {
        const cliente = clientes.find((cliente) => c.clienteId == cliente.id);
        return {
          id: cliente.id,
          nombre: `${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`,
          cantidad: c._count.id,
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

      const rutasFormatted = rutasActualesAbiertas.map((r) => {
        return {
          nombreRuta: r.nombreRuta,
          cobrador: r.cobrador.nombre,
          totalClientes: r.clientes.length,
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
        'Dashboard service -getDashboardTicketProceso',
      );
    }
  }
}
