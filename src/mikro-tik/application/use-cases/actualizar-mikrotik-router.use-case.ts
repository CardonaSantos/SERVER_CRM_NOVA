import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UpdateMikroTikDto } from '../../dto/update-mikro-tik.dto';

import { MikrotikRouterRepositoryPort } from '../../domain/ports/mikrotik-router-repository.port';

import { MIKROTIK_ROUTER_REPOSITORY } from '../../infra/tokens/mikrotik-router.tokens';

import {
  MikrotikRouterPublicoReadModel,
  toMikrotikRouterPublico,
} from '../read-models/mikrotik-router-publico.read-model';

import {
  MIKROTIK_ROUTER_SECRET_CIPHER,
  MikrotikRouterSecretCipherPort,
} from 'src/modules/mikrotik-router-credentials/application/ports/mikrotik-router-secret-cipher.port';

export type ActualizarMikrotikRouterCommand = UpdateMikroTikDto & {
  id: number;
};

@Injectable()
export class ActualizarMikrotikRouterUseCase {
  constructor(
    @Inject(MIKROTIK_ROUTER_REPOSITORY)
    private readonly repository: MikrotikRouterRepositoryPort,

    @Inject(MIKROTIK_ROUTER_SECRET_CIPHER)
    private readonly secretCipher: MikrotikRouterSecretCipherPort,
  ) {}

  async execute(
    command: ActualizarMikrotikRouterCommand,
  ): Promise<MikrotikRouterPublicoReadModel> {
    const router = await this.repository.findById(command.id);

    if (!router) {
      throw new NotFoundException(
        `No existe el router MikroTik ${command.id}.`,
      );
    }

    if (command.nombre !== undefined) {
      const nombre = command.nombre.trim();

      const duplicated = await this.repository.findByName({
        empresaId: router.empresaId,

        nombre,
      });

      if (duplicated && duplicated.id !== router.id) {
        throw new ConflictException(
          `Ya existe otro router MikroTik con el nombre ${nombre}.`,
        );
      }
    }

    const passwordEnc =
      command.password !== undefined
        ? await this.secretCipher.encrypt(command.password)
        : undefined;

    router.actualizar({
      nombre: command.nombre,

      host: command.host,

      sshPort: command.sshPort,

      usuario: command.usuario,

      descripcion: command.descripcion,

      activo: command.activo,

      oltId: command.oltId,

      passwordEnc,
    });

    const updated = await this.repository.update(router);

    return toMikrotikRouterPublico(updated);
  }
}
