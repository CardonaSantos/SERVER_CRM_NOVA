import { Injectable } from '@nestjs/common';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDashboardDto: CreateDashboardDto) {}

  async findAll(tecnicoId: number) {
    try {
      const myTickets = await this.prisma.ticketSoporte.findMany({
        where: {
          tecnicoId: tecnicoId,
        },
        select: {
          id: true,
          titulo: true,
          fechaApertura: true,
          cliente: {
            select: {
              nombre: true,
              apellidos: true,
            },
          },
        },
      });

      const tickets = myTickets.map((t) => ({
        id: t.id,
        cliente: `${t.cliente.nombre} ${t.cliente.nombre}`,
        ticketTexto: t.titulo,
        fechaTicket: t.fechaApertura,
      }));
      return tickets;
    } catch (error) {
      console.log(error);
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

  update(id: number, updateDashboardDto: UpdateDashboardDto) {
    return `This action updates a #${id} dashboard`;
  }

  remove(id: number) {
    return `This action removes a #${id} dashboard`;
  }
}
