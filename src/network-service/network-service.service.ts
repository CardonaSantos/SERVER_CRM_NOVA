import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SshMikrotikConnectionService } from 'src/ssh-mikrotik-connection/application/ssh-mikrotik-connection.service';
import { EstadoCliente, EstadoServicioMikrotik } from '@prisma/client';

@Injectable()
export class NetworkServiceService {
  private readonly logger = new Logger(NetworkServiceService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly sshMikrotik: SshMikrotikConnectionService,
  ) {}

  async syncCustomerNetwork(clienteId: number) {
    const cliente = await this.prisma.clienteInternet.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        mikrotikRouterId: true,
        estadoCliente: true,
        estadoServicioMikrotik: true,
        MikrotikRouter: { select: { id: true } },
        IP: { select: { direccionIp: true } },
      },
    });

    if (!cliente) return;

    const routerId = cliente.MikrotikRouter?.id ?? null;
    const ip = cliente.IP?.direccionIp ?? null;

    // CASO A: sin router o sin IP
    if (!routerId || !ip) {
      this.logger.debug('Sin Mikrotik o sin IP, no se toca red');
      return;
    }

    // CASO B: baja / desinstalado
    if (cliente.estadoCliente === 'DESINSTALADO') {
      await this.sshMikrotik.clearIpFromAllLists(routerId, ip);
      return;
    }

    // CASO C: suspendido
    if (cliente.estadoServicioMikrotik === EstadoServicioMikrotik.SUSPENDIDO) {
      await this.sshMikrotik.clearIpFromAllLists(routerId, ip);
      await this.sshMikrotik.addIpToSuspendedListByRouterId(
        routerId,
        ip,
        `crm-suspendido-${cliente.id}`,
      );
      return;
    }

    // CASO D: activo normal
    if (cliente.estadoServicioMikrotik === EstadoServicioMikrotik.ACTIVO) {
      await this.sshMikrotik.clearIpFromAllLists(routerId, ip);
      return;
    }
  }

  async authorizeInstallation(clienteId: number) {
    const cliente = await this.prisma.clienteInternet.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        estadoCliente: true,
        MikrotikRouter: { select: { id: true } },
        IP: { select: { direccionIp: true } },
      },
    });

    if (
      !cliente ||
      cliente.estadoCliente !== EstadoCliente.EN_INSTALACION ||
      !cliente.MikrotikRouter ||
      !cliente.IP?.direccionIp
    ) {
      throw new BadRequestException('Datos del cliente insuficientes');
    }

    const routerId = cliente.MikrotikRouter.id;
    const ip = cliente.IP.direccionIp;

    try {
      await this.sshMikrotik.clearIpFromAllLists(routerId, ip);
      await this.sshMikrotik.addIpToInternetListByRouterId(
        routerId,
        ip,
        `crm-instalacion-${cliente.id}`,
      );

      await this.prisma.clienteInternet.update({
        where: { id: cliente.id },
        data: {
          estadoCliente: EstadoCliente.ACTIVO,
        },
      });
    } catch (err) {
      await this.sshMikrotik.clearIpFromAllLists(routerId, ip);
      throw err;
    }
  }
}
