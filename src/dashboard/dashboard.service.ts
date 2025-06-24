import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
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
    const [
      activeClientsCount,
      delinquentClientsCount,
      suspendedClientsCount,
      activeServicesCount,
      suspendedServicesCount,
      clientsAddedThisMonthCount,
      lastTicket,
    ] = await Promise.all([
      this.prisma.clienteInternet.count({
        where: { estadoCliente: 'ACTIVO' },
      }),
      this.prisma.clienteInternet.count({
        where: { estadoCliente: 'MOROSO' },
      }),
      this.prisma.clienteInternet.count({
        where: { estadoCliente: 'SUSPENDIDO' },
      }),
      this.prisma.clienteInternet.count({
        where: { estadoCliente: 'ACTIVO' },
      }),
      this.prisma.clienteInternet.count({
        where: { estadoCliente: 'SUSPENDIDO' },
      }),
      this.prisma.clienteInternet.count({
        where: {
          creadoEn: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.prisma.ticketSoporte.findFirst({
        orderBy: { fechaApertura: 'desc' },
      }),
    ]);

    return {
      activeClients: activeClientsCount,
      delinquentClients: delinquentClientsCount,
      suspendedClients: suspendedClientsCount,
      activeServices: activeServicesCount,
      suspendedServices: suspendedServicesCount,
      clientsAddedThisMonth: clientsAddedThisMonthCount,
      lastTicket,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} dashboard`;
  }

  remove(id: number) {
    return `This action removes a #${id} dashboard`;
  }
}
