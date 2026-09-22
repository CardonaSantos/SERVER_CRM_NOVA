import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { NodeSSH } from 'node-ssh';
import * as bcrypt from 'bcryptjs';

import { SuspendCustomerDto } from '../dto/create-ssh-mikrotik-connection.dto';
import { ActivateCustomerDto } from '../dto/activate-ssh-mikrotik.dto';

import { PrismaService } from 'src/prisma/prisma.service';
import { throwFatalError } from 'src/Utils/CommonFatalError';

import {
  MikrotikRouterConnectionContext,
  MikrotikRouterConnectionContextPort,
} from 'src/mikro-tik/domain/ports/mikrotik-router-connection-context.port';

import { MIKROTIK_ROUTER_CONNECTION_CONTEXT } from 'src/mikro-tik/infra/tokens/mikrotik-router.tokens';

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

    @Inject(MIKROTIK_ROUTER_CONNECTION_CONTEXT)
    private readonly routerContext: MikrotikRouterConnectionContextPort,
  ) {}

  /**
   * ============================================================
   * EJECUCIÓN SSH
   * ============================================================
   *
   * Este método recibe una contraseña YA DESCIFRADA.
   *
   * Nunca:
   *
   * - consulta passwordEnc;
   * - conoce el formato criptográfico;
   * - descifra credenciales.
   *
   * Esa responsabilidad pertenece al
   * MikrotikRouterConnectionContextPort.
   */
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

        /**
         * Contraseña plana únicamente en memoria
         * durante la sesión SSH.
         */
        password: config.password,

        tryKeyboard: false,
      });

      this.logger.debug(
        `Ejecutando comando SSH en ${config.host}:${config.port}`,
      );

      const result = await ssh.execCommand(command);

      if (result.stderr) {
        this.logger.error(
          `STDERR MikroTik ${config.host}:${config.port}: ${result.stderr}`,
        );
      }

      return {
        stdout: result.stdout,
        stderr: result.stderr,
      };
    } catch (error) {
      throwFatalError(error, this.logger, 'Ssh-mikrotik - RunCommand');

      throw error;
    } finally {
      this.logger.log(
        `Cerrando conexión a MikroTik ${config.host}:${config.port} con usuario ${config.username}`,
      );

      ssh.dispose();
    }
  }

  /**
   * ============================================================
   * LIMPIEZA DE LISTAS
   * ============================================================
   */
  async clearIpFromAllLists(routerId: number, ip: string): Promise<void> {
    const config = await this.buildConfigFromRouterId(routerId);

    await this.removeIpFromSuspendedList(config, ip);

    await this.removeIpFromInternetList(config, ip);
  }

  /**
   * ============================================================
   * SUSPENDER CLIENTE
   * ============================================================
   */
  async suspendCustomer(dto: SuspendCustomerDto) {
    /**
     * 1. Usuario que autoriza la operación.
     */
    const usuarioAdmin = await this.prisma.usuario.findUnique({
      where: {
        id: dto.userId,
      },
    });

    if (!usuarioAdmin) {
      throw new NotFoundException('Usuario administrador no encontrado');
    }

    /**
     * 2. Cliente + IP + router asociado.
     *
     * Ya NO necesitamos:
     *
     * - host;
     * - sshPort;
     * - usuario SSH;
     * - passwordEnc.
     *
     * Solo necesitamos conocer el routerId.
     */
    const cliente = await this.prisma.clienteInternet.findUnique({
      where: {
        id: dto.clienteId,
      },

      select: {
        id: true,

        nombre: true,

        apellidos: true,

        mikrotikRouterId: true,

        IP: {
          select: {
            id: true,
            direccionIp: true,
            mascara: true,
            gateway: true,
          },
        },
      },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (!cliente.mikrotikRouterId) {
      throw new BadRequestException('El cliente no tiene MikroTik asociado.');
    }

    if (!cliente.IP?.direccionIp) {
      throw new BadRequestException('El cliente no tiene IP asignada');
    }

    /**
     * 3. Reautenticación administrativa.
     *
     * Esto NO tiene relación con la contraseña SSH.
     *
     * Aquí bcrypt verifica la contraseña del usuario
     * del CRM.
     */
    const isValidPassword = await bcrypt.compare(
      dto.password,
      usuarioAdmin.contrasena,
    );

    if (!isValidPassword) {
      throw new BadRequestException('CREDENCIALES NO VÁLIDAS');
    }

    const routerId = cliente.mikrotikRouterId;

    const ip = cliente.IP.direccionIp;

    /**
     * 4. Resolver configuración SSH.
     *
     * routerContext:
     *
     * - consulta el MikroTik;
     * - comprueba que esté activo;
     * - obtiene passwordEnc;
     * - detecta formato nuevo/legacy;
     * - descifra;
     * - devuelve password plano temporal.
     */
    const config = await this.buildConfigFromRouterId(routerId);

    /**
     * 5. Quitar IP de listas anteriores.
     */
    this.logger.log(`[suspendCustomer] Limpiando IP ${ip} de todas las listas`);

    await this.clearIpFromAllLists(routerId, ip);

    /**
     * 6. Agregar a suspendidos.
     */
    const addressList =
      this.config.get<string>('SUSPENDED_LIST') ?? 'clientes_suspendidos';

    const comment =
      `crm-suspendido-${cliente.id}-` +
      `${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`;

    const cmd =
      `/ip firewall address-list add ` +
      `list=${addressList} ` +
      `address=${ip} ` +
      `comment="${comment}"`;

    this.logger.log(
      `[suspendCustomer] Agregando IP ${ip} a lista ${addressList}`,
    );

    const { stdout, stderr } = await this.runCommand(cmd, config);

    if (stderr) {
      throw new InternalServerErrorException(
        `Error suspendiendo cliente en MikroTik: ${stderr}`,
      );
    }

    /**
     * 7. Actualizar CRM.
     */
    await this.prisma.clienteInternet.update({
      where: {
        id: cliente.id,
      },

      data: {
        estadoServicioMikrotik: 'SUSPENDIDO',
      },
    });

    this.logger.log(
      `[suspendCustomer] Cliente ${cliente.id} suspendido correctamente`,
    );

    return {
      ok: true,
      stdout,
    };
  }

  /**
   * ============================================================
   * ACTIVAR CLIENTE
   * ============================================================
   */
  async activateCustomer(dto: ActivateCustomerDto) {
    const usuarioAdmin = await this.prisma.usuario.findUnique({
      where: {
        id: dto.userId,
      },
    });

    if (!usuarioAdmin) {
      throw new NotFoundException('Usuario administrador no encontrado');
    }

    const cliente = await this.prisma.clienteInternet.findUnique({
      where: {
        id: dto.clienteId,
      },

      select: {
        id: true,

        nombre: true,

        apellidos: true,

        mikrotikRouterId: true,

        IP: {
          select: {
            id: true,
            direccionIp: true,
            mascara: true,
            gateway: true,
          },
        },
      },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (!cliente.mikrotikRouterId) {
      throw new BadRequestException('El cliente no tiene MikroTik asociado.');
    }

    if (!cliente.IP?.direccionIp) {
      throw new BadRequestException('El cliente no tiene IP asignada');
    }

    /**
     * Reautenticación administrativa
     * solamente cuando el flujo lo exige.
     */
    if (dto.isPasswordRequired === true) {
      const isValidPassword = await bcrypt.compare(
        dto.password,
        usuarioAdmin.contrasena,
      );

      if (!isValidPassword) {
        throw new BadRequestException('CREDENCIALES NO VÁLIDAS');
      }
    }

    const routerId = cliente.mikrotikRouterId;

    const ip = cliente.IP.direccionIp;

    /**
     * Resuelve la contraseña SSH usando
     * el mecanismo central.
     */
    await this.buildConfigFromRouterId(routerId);

    /**
     * Quitar la IP de cualquier lista
     * previa antes de autorizarla.
     */
    this.logger.log(
      `[activateCustomer] Limpiando IP ${ip} de todas las listas`,
    );

    await this.clearIpFromAllLists(routerId, ip);

    /**
     * Agregar a internet_ok.
     */
    this.logger.log(
      `[activateCustomer] Agregando IP ${ip} a lista internet_ok`,
    );

    await this.addIpToInternetListByRouterId(
      routerId,
      ip,
      `crm-activo-${cliente.id}-${cliente.nombre ?? ''} ${cliente.apellidos ?? ''}`,
    );

    /**
     * Actualizar CRM.
     */
    await this.prisma.clienteInternet.update({
      where: {
        id: cliente.id,
      },

      data: {
        estadoServicioMikrotik: 'ACTIVO',
      },
    });

    this.logger.log(
      `[activateCustomer] Cliente ${cliente.id} activado correctamente`,
    );

    return {
      ok: true,
    };
  }

  /**
   * ============================================================
   * AGREGAR IP A INTERNET_OK
   * ============================================================
   */
  async addIpToInternetListByRouterId(
    routerId: number,
    ip: string,
    comment: string,
  ): Promise<void> {
    const config = await this.buildConfigFromRouterId(routerId);

    const addressList =
      this.config.get<string>('LISTA_INTERNET_OK') ?? 'internet_ok';

    const cmd =
      `/ip firewall address-list add ` +
      `list=${addressList} ` +
      `address=${ip} ` +
      `comment="${comment}"`;

    const { stderr } = await this.runCommand(cmd, config);

    if (stderr) {
      this.logger.error(
        `Error agregando IP ${ip} a lista ${addressList} en router ${routerId}: ${stderr}`,
      );

      throw new InternalServerErrorException(
        'Error autorizando IP en MikroTik',
      );
    }

    this.logger.log(
      `IP ${ip} agregada a lista ${addressList} en router ${routerId}`,
    );
  }

  /**
   * ============================================================
   * VERIFICAR SUSPENSIÓN
   * ============================================================
   *
   * Conservamos este método porque puede existir
   * código externo que ya construye MkConfig.
   */
  async isCustomerSuspendedInMikrotik(
    config: MkConfig,
    ip: string,
  ): Promise<boolean> {
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

      const cmd =
        `/ip firewall address-list print ` +
        `where list=${addressList} and address=${ip}`;

      const result = await ssh.execCommand(cmd);

      if (result.stderr) {
        this.logger.error(
          `Error consultando lista en MikroTik: ${result.stderr}`,
        );
      }

      return Boolean(result.stdout && result.stdout.trim().length > 0);
    } finally {
      ssh.dispose();
    }
  }

  /**
   * ============================================================
   * REMOVER IP DE SUSPENDIDOS
   * ============================================================
   */
  async removeIpFromSuspendedList(config: MkConfig, ip: string): Promise<void> {
    const addressList =
      this.config.get<string>('SUSPENDED_LIST') ?? 'clientes_suspendidos';

    const cmd =
      `/ip firewall address-list remove ` +
      `[find list=${addressList} address=${ip}]`;

    const { stdout, stderr } = await this.runCommand(cmd, config);

    if (stderr) {
      this.logger.error(
        `Error removiendo IP de lista de suspendidos en MikroTik: ${stderr}`,
      );

      return;
    }

    this.logger.log(
      `IP ${ip} removida de lista ${addressList}. Respuesta: ${stdout}`,
    );
  }

  /**
   * ============================================================
   * CONFIGURACIÓN DEL ROUTER
   * ============================================================
   *
   * Este es ahora el ÚNICO punto de este servicio
   * que resuelve las credenciales de un MikroTik.
   *
   * Pero incluso aquí este servicio NO descifra nada.
   *
   * Toda la responsabilidad queda delegada a:
   *
   * ResolverContextoConexionMikrotikUseCase
   *     ↓
   * MIKROTIK_ROUTER_SECRET_CIPHER
   */
  private async buildConfigFromRouterId(routerId: number): Promise<MkConfig> {
    const router = await this.routerContext.resolve(routerId);

    return this.toMkConfig(router);
  }

  /**
   * Adaptador puramente interno:
   *
   * Contexto hexagonal
   *      ↓
   * configuración legacy de NodeSSH.
   */
  private toMkConfig(router: MikrotikRouterConnectionContext): MkConfig {
    return {
      host: router.host,

      port: router.port,

      username: router.username,

      password: router.password,
    };
  }

  /**
   * ============================================================
   * AGREGAR IP A SUSPENDIDOS
   * ============================================================
   */
  async addIpToSuspendedListByRouterId(
    routerId: number,
    ip: string,
    comment: string,
  ): Promise<void> {
    const config = await this.buildConfigFromRouterId(routerId);

    const addressList =
      this.config.get<string>('SUSPENDED_LIST') ?? 'clientes_suspendidos';

    const cmd =
      `/ip firewall address-list add ` +
      `list=${addressList} ` +
      `address=${ip} ` +
      `comment="${comment}"`;

    const { stderr } = await this.runCommand(cmd, config);

    if (stderr) {
      this.logger.error(
        `Error agregando IP ${ip} a lista ${addressList} en router ${routerId}: ${stderr}`,
      );
    }
  }

  /**
   * ============================================================
   * QUITAR IP DE SUSPENDIDOS POR ROUTER ID
   * ============================================================
   */
  async removeIpFromSuspendedListByRouterId(
    routerId: number,
    ip: string,
  ): Promise<void> {
    const config = await this.buildConfigFromRouterId(routerId);

    await this.removeIpFromSuspendedList(config, ip);
  }

  /**
   * ============================================================
   * QUITAR IP DE INTERNET_OK POR ROUTER ID
   * ============================================================
   */
  async removeIpFromListarInternetOkByRouterId(
    routerId: number,
    ip: string,
  ): Promise<void> {
    const config = await this.buildConfigFromRouterId(routerId);

    await this.removeIpFromInternetList(config, ip);
  }

  /**
   * ============================================================
   * REMOVER IP DE INTERNET_OK
   * ============================================================
   */
  private async removeIpFromInternetList(
    config: MkConfig,
    ip: string,
  ): Promise<void> {
    const addressList =
      this.config.get<string>('LISTA_INTERNET_OK') ?? 'internet_ok';

    const cmd =
      `/ip firewall address-list remove ` +
      `[find list=${addressList} address=${ip}]`;

    const { stderr } = await this.runCommand(cmd, config);

    if (stderr) {
      this.logger.error(
        `Error removiendo IP ${ip} de lista ${addressList}: ${stderr}`,
      );
    }
  }

  /**
   * ============================================================
   * VERIFICAR IP SUSPENDIDA POR ROUTER ID
   * ============================================================
   */
  async isIpSuspendedInRouter(routerId: number, ip: string): Promise<boolean> {
    const config = await this.buildConfigFromRouterId(routerId);

    const addressList =
      this.config.get<string>('SUSPENDED_LIST') ?? 'clientes_suspendidos';

    const cmd =
      `/ip firewall address-list print ` +
      `where list=${addressList} and address=${ip}`;

    const { stdout, stderr } = await this.runCommand(cmd, config);

    if (stderr) {
      this.logger.error(
        `Error consultando lista ${addressList} en router ${routerId}: ${stderr}`,
      );

      return false;
    }

    return Boolean(stdout && stdout.trim().length > 0);
  }
}
