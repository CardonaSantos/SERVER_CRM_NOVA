import { Injectable, Logger } from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { PrismaService } from 'src/prisma/prisma.service';
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
                ],
              },
            },
            {
              OR: [
                { tecnicoId: tecnicoId },
                {
                  asignaciones: {
                    some: { tecnicoId: tecnicoId },
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
            clientId: t.cliente.id,
            clientName: `${t.cliente.nombre} ${t.cliente.apellidos}`,
            clientPhone: t.cliente.telefono,
            referenceContact: t.cliente.contactoReferenciaTelefono,
            direction: t.cliente.direccion,
            location: loc ? { lat: loc.latitud, lng: loc.longitud } : null, // o undefined si prefieres
          };
        });
    } catch (error) {
      console.log('El error es:');
      return error;
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
        where: { creadoEn: { gte: inicioMes } },
      }),

      // Facturas cobradas
      this.prisma.facturaInternet.count({
        where: {
          estadoFacturaInternet: 'PAGADA',
          fechaPagada: { gte: inicioMes, lte: finMes },
        },
      }),
      this.prisma.facturaInternet.count({
        where: { estadoFacturaInternet: 'PAGADA' },
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

  findOne(id: number) {
    return `This action returns a #${id} dashboard`;
  }

  remove(id: number) {
    return `This action removes a #${id} dashboard`;
  }
}
