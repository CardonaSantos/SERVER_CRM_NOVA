import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  MikrotikRouterConnectionContext,
  MikrotikRouterConnectionContextPort,
} from '../../domain/ports/mikrotik-router-connection-context.port';

import { MikrotikRouterRepositoryPort } from '../../domain/ports/mikrotik-router-repository.port';

import { MIKROTIK_ROUTER_REPOSITORY } from '../../infra/tokens/mikrotik-router.tokens';

import {
  MIKROTIK_ROUTER_SECRET_CIPHER,
  MikrotikRouterSecretCipherPort,
} from 'src/modules/mikrotik-router-credentials/application/ports/mikrotik-router-secret-cipher.port';

@Injectable()
export class ResolverContextoConexionMikrotikUseCase
  implements MikrotikRouterConnectionContextPort
{
  constructor(
    @Inject(MIKROTIK_ROUTER_REPOSITORY)
    private readonly repository: MikrotikRouterRepositoryPort,

    @Inject(MIKROTIK_ROUTER_SECRET_CIPHER)
    private readonly secretCipher: MikrotikRouterSecretCipherPort,
  ) {}

  async resolve(routerId: number): Promise<MikrotikRouterConnectionContext> {
    if (!Number.isInteger(routerId) || routerId <= 0) {
      throw new BadRequestException('routerId debe ser un entero positivo.');
    }

    const router = await this.repository.findById(routerId);

    if (!router) {
      throw new NotFoundException(`No existe el router MikroTik ${routerId}.`);
    }

    if (!router.activo) {
      throw new ConflictException(
        `El router MikroTik ${routerId} está inactivo.`,
      );
    }

    if (!router.passwordEnc) {
      throw new ConflictException(
        `El router MikroTik ${routerId} no tiene una credencial SSH configurada.`,
      );
    }

    const password = await this.secretCipher.decrypt(router.passwordEnc);

    return {
      routerId,

      host: router.host,

      port: router.sshPort,

      username: router.usuario,

      password,
    };
  }
}
