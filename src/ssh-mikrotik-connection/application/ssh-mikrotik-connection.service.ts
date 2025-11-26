import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SuspendCustomerDto } from '../dto/create-ssh-mikrotik-connection.dto';
import { NodeSSH } from 'node-ssh';
import { ConfigService } from '@nestjs/config';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bycrypt from 'bcryptjs';
import { ActivateCustomerDto } from '../dto/activate-ssh-mikrotik.dto';
import { MikrotikCryptoService } from '../helpers/mikrotik-crypto.service';

interface MkConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

@Injectable()
export class SshMikrotikConnectionService {
  private readonly logger = new Logger(SshMikrotikConnectionService.name);
  private connected = false;
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mkCrypto: MikrotikCryptoService,
  ) {}

  async runCommand(command: string, config: MkConfig) {
    const ssh = new NodeSSH();
    try {
      this.logger.log(
        `Conectando a MikroTik ${config.host}:${config.port} con usuario ${config.username}`,
      );

      await ssh.connect({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        tryKeyboard: false,
      });

      this.logger.debug(`Ejecutando comando: ${command}`);
      const result = await ssh.execCommand(command);

      if (result.stderr) {
        this.logger.error(`STDERR: ${result.stderr}`);
      }

      return {
        stdout: result.stdout,
        stderr: result.stderr,
      };
    } catch (error) {
      throwFatalError(error, this.logger, 'Ssh-mikrotik -RunCommand');
    } finally {
      this.logger.log(
        `Cerrando conexión a MikroTik ${config.host}:${config.port} con usuario ${config.username}`,
      );
      ssh.dispose(); // no hace falta await, es sync
    }
  }

  // FIRST TESTS
  async suspendCustomer(dto: SuspendCustomerDto) {
    const usuarioAdmin = await this.prisma.usuario.findUnique({
      where: {
        id: dto.userId,
      },
    });

    const cliente = await this.prisma.clienteInternet.findUnique({
      where: {
        id: dto.clienteId,
      },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        IP: {
          select: {
            id: true,
            direccionIp: true,
            mascara: true,
            gateway: true,
          },
        },
        MikrotikRouter: {
          select: {
            id: true,
            host: true,
            sshPort: true,
            usuario: true,
            passwordEnc: true,
          },
        },
      },
    });

    if (!cliente.MikrotikRouter) {
      throw new BadRequestException(
        'El cliente no tiene Mikrotik asociado (MikrotikRouter nulo)',
      );
    }

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (!usuarioAdmin) {
      throw new NotFoundException('Usuario administrador no encontrado');
    }

    const isValidPassword = await bycrypt.compare(
      dto.password,
      usuarioAdmin.contrasena,
    );

    if (!isValidPassword)
      throw new BadRequestException('CREDENCIALES NO VÁLIDAS');

    const ip = cliente.IP.direccionIp;

    if (!ip) {
      throw new BadRequestException('El cliente no tiene IP asignada');
    }
    const password = this.mkCrypto.decrypt(cliente.MikrotikRouter.passwordEnc);

    const config: MkConfig = {
      host: cliente.MikrotikRouter.host,
      port: cliente.MikrotikRouter.sshPort,
      username: cliente.MikrotikRouter.usuario,
      password: password,
    };

    this.logger.log('El config creado es: ', config);

    const addressList =
      this.config.get<string>('SUSPENDED_LIST') ?? 'clientes_suspendidos';
    const comment = `crm-suspendido-${cliente.id}-${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`;
    const cmd = `/ip firewall address-list add list=${addressList} address=${ip} comment="${comment}"`;
    const { stdout, stderr } = await this.runCommand(cmd, config);

    if (stderr) {
      throw new InternalServerErrorException(
        `Error suspendiendo cliente en Mikrotik: ${stderr}`,
      );
    }
    // TODO: aquí ya puedes crear tu entidad "SuspensionCliente", guardar log, enviar notificación, etc.
    await this.prisma.clienteInternet.update({
      where: {
        id: cliente.id,
      },
      data: {
        estadoServicioMikrotik: 'SUSPENDIDO',
      },
    });
    return { ok: true, stdout };
  }

  async activateCustomer(dto: ActivateCustomerDto) {
    const usuarioAdmin = await this.prisma.usuario.findUnique({
      where: {
        id: dto.userId,
      },
    });

    const cliente = await this.prisma.clienteInternet.findUnique({
      where: {
        id: dto.clienteId,
      },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        IP: {
          select: {
            id: true,
            direccionIp: true,
            mascara: true,
            gateway: true,
          },
        },
        MikrotikRouter: {
          select: {
            id: true,
            host: true,
            sshPort: true,
            usuario: true,
            passwordEnc: true,
          },
        },
      },
    });

    if (!cliente.MikrotikRouter) {
      throw new BadRequestException(
        'El cliente no tiene Mikrotik asociado (MikrotikRouter nulo)',
      );
    }

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (!usuarioAdmin) {
      throw new NotFoundException('Usuario administrador no encontrado');
    }

    const isValidPassword = await bycrypt.compare(
      dto.password,
      usuarioAdmin.contrasena,
    );

    if (!isValidPassword)
      throw new BadRequestException('CREDENCIALES NO VÁLIDAS');

    const ip = cliente.IP.direccionIp;

    if (!ip) {
      throw new BadRequestException('El cliente no tiene IP asignada');
    }
    const password = this.mkCrypto.decrypt(cliente.MikrotikRouter.passwordEnc);
    const config: MkConfig = {
      host: cliente.MikrotikRouter.host,
      port: cliente.MikrotikRouter.sshPort,
      username: cliente.MikrotikRouter.usuario,
      password: password,
    };

    this.logger.log('El config creado es: ', config);

    const addressList =
      this.config.get<string>('SUSPENDED_LIST') ?? 'clientes_suspendidos';
    const cmd = `/ip firewall address-list remove [find list=${addressList} address=${ip}]`;
    const { stdout, stderr } = await this.runCommand(cmd, config);

    if (stderr) {
      throw new InternalServerErrorException(
        `Error activando cliente en Mikrotik: ${stderr}`,
      );
    }

    await this.prisma.clienteInternet.update({
      where: {
        id: cliente.id,
      },
      data: {
        estadoServicioMikrotik: 'ACTIVO',
      },
    });

    return { ok: true, stdout };
  }
}
