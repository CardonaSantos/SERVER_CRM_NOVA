import { Injectable } from '@nestjs/common';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDashboardDto: CreateDashboardDto) {}

  /**
   * Devuelve todos los tickets activos de un técnico,
   * formateados para el frontend.
   */
  async findAll(tecnicoId: number) {
    const rawTickets = await this.prisma.ticketSoporte.findMany({
      orderBy: {
        fechaApertura: 'asc',
      },
      where: {
        tecnicoId,
        estado: {
          notIn: ['RESUELTA', 'CANCELADA', 'ARCHIVADA', 'CERRADO'],
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

    return rawTickets
      .sort(
        (a, b) =>
          new Date(a.fechaApertura).getTime() -
          new Date(b.fechaApertura).getTime(),
      )
      .map((t) => ({
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
        location: {
          lat: t.cliente.ubicacion.latitud,
          lng: t.cliente.ubicacion.longitud,
        },
      }));
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

  update(id: number, updateDashboardDto: UpdateDashboardDto) {
    return `This action updates a #${id} dashboard`;
  }

  remove(id: number) {
    return `This action removes a #${id} dashboard`;
  }
}
