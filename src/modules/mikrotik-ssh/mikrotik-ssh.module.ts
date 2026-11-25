import { Module } from '@nestjs/common';

import { mikrotikSshConfigProvider } from './infra/config/mikrotik-ssh-config.provider';
import { MikrotikPppoeCommandBuilder } from './infra/routeros/mikrotik-pppoe-command.builder';
import { MikrotikPppoeResponseParser } from './infra/routeros/mikrotik-pppoe-response.parser';
import { RouterOsValueEscaper } from './infra/routeros/routeros-value-escaper';
import { MikrotikSshCommandExecutor } from './infra/ssh/mikrotik-ssh-command.executor';
import { MikrotikSshAdapter } from './infra/ssh/mikrotik-ssh.adapter';
import { MIKROTIK_SSH_PORT } from './public/mikrotik-ssh.port';

/**
 * Conexión SSH a routers MikroTik y comandos PPPoE de RouterOS.
 *
 * API pública (`public/`): MIKROTIK_SSH_PORT (abre sesiones), el puerto de
 * sesión y los tipos de `mikrotik-ssh.types.ts`. ConfigService es global.
 */
@Module({
  providers: [
    // Configuración desde variables de entorno (MIKROTIK_SSH_CONFIG)
    mikrotikSshConfigProvider,

    // Componentes internos de RouterOS y SSH
    RouterOsValueEscaper,
    MikrotikPppoeCommandBuilder,
    MikrotikPppoeResponseParser,
    MikrotikSshCommandExecutor,

    // Adaptadores
    { provide: MIKROTIK_SSH_PORT, useClass: MikrotikSshAdapter },
  ],
  exports: [MIKROTIK_SSH_PORT],
})
export class MikrotikSshModule {}
