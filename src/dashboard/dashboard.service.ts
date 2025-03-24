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
      const dataUsuarios = await this.prisma.clienteInternet.findMany({
        include: {
          saldoCliente: true,
          servicioInternet: true,
        },
      });
      const serviciosConClientes = await this.prisma.servicioInternet.findMany({
        include: {
          clienteInternet: true,
        },
      });

      const clientesActivos = dataUsuarios.filter((c) => {
        return c.estadoCliente === 'ACTIVO';
      });

      const clientesMorosos = dataUsuarios.filter((c) => {
        c.saldoCliente.saldoPendiente >= 1;
      });

      const clientesSuspendidos = dataUsuarios.filter(
        (c) => c.estadoCliente === 'SUSPENDIDO',
      );

      const clientesDesconectados = dataUsuarios.filter(
        (c) => c.estadoCliente === 'DESINSTALADO',
      );

      // const serviciosActivos = serviciosConClientes.filter(
      //   (s) => s.clienteInternet.estadoCliente === 'ACTIVO',
      // );

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
