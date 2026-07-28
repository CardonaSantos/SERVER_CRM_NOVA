import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { mikrotikSshConfigProvider } from './config/mikrotik-ssh-config.provider';

import { MIKROTIK_SSH_PORT } from './domain/ports/mikrotik-ssh.port';

import { MikrotikPppoeCommandBuilder } from './infra/routeros/mikrotik-pppoe-command.builder';
import { MikrotikPppoeResponseParser } from './infra/routeros/mikrotik-pppoe-response.parser';
import { RouterOsValueEscaper } from './infra/routeros/routeros-value-escaper';

import { MikrotikSshAdapter } from './infra/ssh/mikrotik-ssh.adapter';
import { MikrotikSshCommandExecutor } from './infra/ssh/mikrotik-ssh-command.executor';

@Module({
  imports: [
    /**
     * Necesario para que el provider SSH pueda
     * inyectar ConfigService.
     */
    ConfigModule,
  ],

  providers: [
    /**
     * Configuración obtenida desde variables de entorno.
     */
    mikrotikSshConfigProvider,

    /**
     * Componentes internos de RouterOS.
     */
    RouterOsValueEscaper,
    MikrotikPppoeCommandBuilder,
    MikrotikPppoeResponseParser,

    /**
     * Infraestructura SSH.
     */
    MikrotikSshCommandExecutor,
    MikrotikSshAdapter,

    /**
     * Implementación del puerto público.
     */
    {
      provide: MIKROTIK_SSH_PORT,
      useExisting: MikrotikSshAdapter,
    },
  ],

  /**
   * Otros módulos solo deben acceder al puerto.
   */
  exports: [MIKROTIK_SSH_PORT],
})
export class MikrotikSshModule {}
