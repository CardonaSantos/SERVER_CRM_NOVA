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

  /**
   * Helper eliminacion de ip de cualquier lista
   * @param routerId
   * @param ip
   */
  async clearIpFromAllLists(routerId: number, ip: string) {
    await this.removeIpFromSuspendedListByRouterId(routerId, ip);
    await this.removeIpFromListarInternetOkByRouterId(routerId, ip);
  }

  // SUSPENDER
  async suspendCustomer(dto: SuspendCustomerDto) {
    // ─── 1. OBTENER DATOS ────────────────────────────────────────────────────
    const usuarioAdmin = await this.prisma.usuario.findUnique({
      where: { id: dto.userId },
    });

    if (!usuarioAdmin) {
      throw new NotFoundException('Usuario administrador no encontrado');
    }

    const cliente = await this.prisma.clienteInternet.findUnique({
      where: { id: dto.clienteId },
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

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // ─── 2. VALIDACIONES ─────────────────────────────────────────────────────
    if (!cliente.MikrotikRouter) {
      throw new BadRequestException(
        'El cliente no tiene Mikrotik asociado (MikrotikRouter nulo)',
      );
    }

    if (!cliente.IP?.direccionIp) {
      throw new BadRequestException('El cliente no tiene IP asignada');
    }

    // ─── 3. VERIFICAR CREDENCIALES ───────────────────────────────────────────
    const isValidPassword = await bycrypt.compare(
      dto.password,
      usuarioAdmin.contrasena,
    );

    if (!isValidPassword) {
      throw new BadRequestException('CREDENCIALES NO VÁLIDAS');
    }

    // ─── 4. CONSTRUIR CONFIG SSH ──────────────────────────────────────────────
    const password = this.mkCrypto.decrypt(cliente.MikrotikRouter.passwordEnc);
    const config: MkConfig = {
      host: cliente.MikrotikRouter.host,
      port: cliente.MikrotikRouter.sshPort,
      username: cliente.MikrotikRouter.usuario,
      password,
    };

    const ip = cliente.IP.direccionIp;

    // ─── 5. LIMPIAR LISTAS EN MIKROTIK (internet_ok + suspendidos) ───────────
    this.logger.log(`[suspendCustomer] Limpiando IP ${ip} de todas las listas`);
    await this.clearIpFromAllLists(cliente.MikrotikRouter.id, ip);

    // ─── 6. AGREGAR A LISTA DE SUSPENDIDOS EN MIKROTIK ───────────────────────
    const addressList =
      this.config.get<string>('SUSPENDED_LIST') ?? 'clientes_suspendidos';
    const comment = `crm-suspendido-${cliente.id}-${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`;
    const cmd = `/ip firewall address-list add list=${addressList} address=${ip} comment="${comment}"`;

    this.logger.log(
      `[suspendCustomer] Agregando IP ${ip} a lista ${addressList}`,
    );
    const { stdout, stderr } = await this.runCommand(cmd, config);

    if (stderr) {
      throw new InternalServerErrorException(
        `Error suspendiendo cliente en Mikrotik: ${stderr}`,
      );
    }

    // ─── 7. ACTUALIZAR ESTADO EN BASE DE DATOS ────────────────────────────────
    await this.prisma.clienteInternet.update({
      where: { id: cliente.id },
      data: { estadoServicioMikrotik: 'SUSPENDIDO' },
    });

    this.logger.log(
      `[suspendCustomer] Cliente ${cliente.id} suspendido correctamente`,
    );
    return { ok: true, stdout };
  }

  // ACTIVAR

  async activateCustomer(dto: ActivateCustomerDto) {
    // ─── 1. OBTENER DATOS ────────────────────────────────────────────────────
    const usuarioAdmin = await this.prisma.usuario.findUnique({
      where: { id: dto.userId },
    });

    if (!usuarioAdmin) {
      throw new NotFoundException('Usuario administrador no encontrado');
    }

    const cliente = await this.prisma.clienteInternet.findUnique({
      where: { id: dto.clienteId },
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

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // ─── 2. VALIDACIONES ─────────────────────────────────────────────────────
    if (!cliente.MikrotikRouter) {
      throw new BadRequestException(
        'El cliente no tiene Mikrotik asociado (MikrotikRouter nulo)',
      );
    }

    if (!cliente.IP?.direccionIp) {
      throw new BadRequestException('El cliente no tiene IP asignada');
    }

    // ─── 3. VERIFICAR CREDENCIALES (condicional) ──────────────────────────────
    if (dto.isPasswordRequired === true) {
      const isValidPassword = await bycrypt.compare(
        dto.password,
        usuarioAdmin.contrasena,
      );

      if (!isValidPassword) {
        throw new BadRequestException('CREDENCIALES NO VÁLIDAS');
      }
    }

    // ─── 4. CONSTRUIR CONFIG SSH ──────────────────────────────────────────────
    const password = this.mkCrypto.decrypt(cliente.MikrotikRouter.passwordEnc);
    const config: MkConfig = {
      host: cliente.MikrotikRouter.host,
      port: cliente.MikrotikRouter.sshPort,
      username: cliente.MikrotikRouter.usuario,
      password,
    };

    const ip = cliente.IP.direccionIp;

    // ─── 5. LIMPIAR LISTAS EN MIKROTIK (internet_ok + suspendidos) ───────────
    this.logger.log(
      `[activateCustomer] Limpiando IP ${ip} de todas las listas`,
    );
    await this.clearIpFromAllLists(cliente.MikrotikRouter.id, ip);

    // ─── 6. AGREGAR A LISTA DE INTERNET OK EN MIKROTIK ───────────────────────
    this.logger.log(
      `[activateCustomer] Agregando IP ${ip} a lista internet_ok`,
    );
    await this.addIpToInternetListByRouterId(
      cliente.MikrotikRouter.id,
      ip,
      `crm-activo-${cliente.id}-${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`,
    );

    // ─── 7. ACTUALIZAR ESTADO EN BASE DE DATOS ────────────────────────────────
    await this.prisma.clienteInternet.update({
      where: { id: cliente.id },
      data: { estadoServicioMikrotik: 'ACTIVO' },
    });

    this.logger.log(
      `[activateCustomer] Cliente ${cliente.id} activado correctamente`,
    );
    return { ok: true };
  }

  /**
   * Metodo para cuando sea una instalacion
   * @param routerId
   * @param ip
   * @param comment
   */
  async addIpToInternetListByRouterId(
    routerId: number,
    ip: string,
    comment: string,
  ): Promise<void> {
    const config = await this.buildConfigFromRouterId(routerId);

    const addressList =
      this.config.get<string>('LISTA_INTERNET_OK') ?? 'internet_ok';

    const cmd = `/ip firewall address-list add list=${addressList} address=${ip} comment="${comment}"`;

    const { stderr } = await this.runCommand(cmd, config);

    if (stderr) {
      this.logger.error(
        `Error agregando IP ${ip} a lista ${addressList} en router ${routerId}: ${stderr}`,
      );
      throw new InternalServerErrorException(
        'Error autorizando IP en Mikrotik',
      );
    }

    this.logger.log(
      `IP ${ip} agregada a lista ${addressList} en router ${routerId}`,
    );
  }

  // VERIFICAR QUE ESTE EN LISTA
  async isCustomerSuspendedInMikrotik(config: MkConfig, ip: string) {
    const ssh = new NodeSSH();
    try {
      await ssh.connect({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        tryKeyboard: false,
      });

      const addressList =
        this.config.get<string>('SUSPENDED_LIST') ?? 'clientes_suspendidos';

      const cmd = `/ip firewall address-list print where list=${addressList} and address=${ip}`;
      const result = await ssh.execCommand(cmd);

      if (result.stderr) {
        this.logger.error(
          `Error consultando lista en Mikrotik: ${result.stderr}`,
        );
        // según tu criterio: o lanzar error o asumir "no suspendido"
      }

      // Si stdout tiene algo, es que encontró una entrada
      const isSuspended = !!result.stdout && result.stdout.trim().length > 0;

      return isSuspended;
    } finally {
      ssh.dispose();
    }
  }

  // QUITAR IP DE MK
  // helpers para suspensión "baja nivel", sin DTO de usuario/admin
  async removeIpFromSuspendedList(config: MkConfig, ip: string) {
    const ssh = new NodeSSH();
    try {
      await ssh.connect({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        tryKeyboard: false,
      });

      const addressList =
        this.config.get<string>('SUSPENDED_LIST') ?? 'clientes_suspendidos';

      const cmd = `/ip firewall address-list remove [find list=${addressList} address=${ip}]`;
      const { stdout, stderr } = await ssh.execCommand(cmd);

      if (stderr) {
        this.logger.error(
          `Error removiendo IP de lista de suspendidos en Mikrotik: ${stderr}`,
        );
      } else {
        this.logger.log(
          `IP ${ip} removida de lista ${addressList}. Respuesta: ${stdout}`,
        );
      }
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'Ssh-mikrotik -removeIpFromSuspendedList',
      );
    } finally {
      ssh.dispose();
    }
  }

  // GENERICOS
  private async buildConfigFromRouterId(routerId: number): Promise<MkConfig> {
    const router = await this.prisma.mikrotikRouter.findUnique({
      where: { id: routerId },
      select: {
        host: true,
        sshPort: true,
        usuario: true,
        passwordEnc: true,
      },
    });

    if (!router) {
      throw new Error(`MikrotikRouter ${routerId} no encontrado`);
    }

    const password = this.mkCrypto.decrypt(router.passwordEnc);

    return {
      host: router.host,
      port: router.sshPort,
      username: router.usuario,
      password,
    };
  }

  async addIpToSuspendedListByRouterId(
    routerId: number,
    ip: string,
    comment: string,
  ): Promise<void> {
    const config = await this.buildConfigFromRouterId(routerId);

    const addressList =
      this.config.get<string>('SUSPENDED_LIST') ?? 'clientes_suspendidos';
    const cmd = `/ip firewall address-list add list=${addressList} address=${ip} comment="${comment}"`;

    const { stderr } = await this.runCommand(cmd, config);
    if (stderr) {
      this.logger.error(
        `Error agregando IP ${ip} a lista ${addressList} en router ${routerId}: ${stderr}`,
      );
    }
  }

  /**
   * Limpiar de la lista de suspendidos
   * @param routerId
   * @param ip
   */
  async removeIpFromSuspendedListByRouterId(
    routerId: number,
    ip: string,
  ): Promise<void> {
    const config = await this.buildConfigFromRouterId(routerId);

    const addressList =
      this.config.get<string>('SUSPENDED_LIST') ?? 'clientes_suspendidos';
    const cmd = `/ip firewall address-list remove [find list=${addressList} address=${ip}]`;

    const { stderr } = await this.runCommand(cmd, config);
    if (stderr) {
      this.logger.error(
        `Error removiendo IP ${ip} de lista ${addressList} en router ${routerId}: ${stderr}`,
      );
    }
  }

  /**
   * Limpiar de la lista de internet ok
   * @param routerId
   * @param ip
   */
  async removeIpFromListarInternetOkByRouterId(
    routerId: number,
    ip: string,
  ): Promise<void> {
    const config = await this.buildConfigFromRouterId(routerId);

    const addressList =
      this.config.get<string>('LISTA_INTERNET_OK') ?? 'internet_ok';
    const cmd = `/ip firewall address-list remove [find list=${addressList} address=${ip}]`;

    const { stderr } = await this.runCommand(cmd, config);
    if (stderr) {
      this.logger.error(
        `Error removiendo IP ${ip} de lista ${addressList} en router ${routerId}: ${stderr}`,
      );
    }
  }

  async isIpSuspendedInRouter(routerId: number, ip: string): Promise<boolean> {
    const config = await this.buildConfigFromRouterId(routerId);

    const addressList =
      this.config.get<string>('SUSPENDED_LIST') ?? 'clientes_suspendidos';
    const cmd = `/ip firewall address-list print where list=${addressList} and address=${ip}`;

    const { stdout, stderr } = await this.runCommand(cmd, config);

    if (stderr) {
      this.logger.error(
        `Error consultando lista ${addressList} en router ${routerId}: ${stderr}`,
      );
      return false;
    }

    return !!stdout && stdout.trim().length > 0;
  }
}
