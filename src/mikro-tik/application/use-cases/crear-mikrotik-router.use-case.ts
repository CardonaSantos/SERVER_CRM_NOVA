import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { MIKROTIK_ROUTER_REPOSITORY } from '../../infra/tokens/mikrotik-router.tokens';

import { MikrotikRouterRepositoryPort } from '../../domain/ports/mikrotik-router-repository.port';

import { CreateMikroTikDto } from '../../dto/create-mikro-tik.dto';

import {
  MikrotikRouterPublicoReadModel,
  toMikrotikRouterPublico,
} from '../read-models/mikrotik-router-publico.read-model';

import {
  MIKROTIK_ROUTER_SECRET_CIPHER,
  MikrotikRouterSecretCipherPort,
} from 'src/modules/mikrotik-router-credentials/application/ports/mikrotik-router-secret-cipher.port';
import { MikrotikRouterEntity } from 'src/mikro-tik/domain/entities/mikrotik-router-entity';

@Injectable()
export class CrearMikrotikRouterUseCase {
  constructor(
    @Inject(MIKROTIK_ROUTER_REPOSITORY)
    private readonly repository: MikrotikRouterRepositoryPort,

    @Inject(MIKROTIK_ROUTER_SECRET_CIPHER)
    private readonly secretCipher: MikrotikRouterSecretCipherPort,
  ) {}

  async execute(
    command: CreateMikroTikDto,
  ): Promise<MikrotikRouterPublicoReadModel> {
    const nombre = command.nombre.trim();

    const duplicated = await this.repository.findByName({
      empresaId: command.empresaId,

      nombre,
    });

    if (duplicated) {
      throw new ConflictException(
        `Ya existe un router MikroTik con el nombre ${nombre}.`,
      );
    }

    const passwordEnc = await this.secretCipher.encrypt(command.password);

    const entity = MikrotikRouterEntity.create({
      empresaId: command.empresaId,

      nombre,

      host: command.host,

      sshPort: command.sshPort ?? 22,

      usuario: command.usuario,

      descripcion: command.descripcion ?? null,

      activo: command.activo ?? true,

      oltId: command.oltId ?? null,

      passwordEnc,
    });

    const created = await this.repository.create(entity);

    return toMikrotikRouterPublico(created);
  }
}
