import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { createHash } from 'node:crypto';

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
  private readonly logger = new Logger(ActualizarMikrotikRouterUseCase.name);

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

    /**
     * Si posteriormente dejamos los routers retirados
     * bloqueados para edición, esta validación se queda.
     */
    if (!router.activo) {
      throw new ConflictException(
        `El router MikroTik ${command.id} se encuentra retirado y no puede modificarse.`,
      );
    }

    /**
     * ==========================================================
     * VALIDAR NOMBRE
     * ==========================================================
     */
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

    /**
     * ==========================================================
     * CREDENCIAL SSH
     * ==========================================================
     *
     * IMPORTANTE:
     *
     * - Si NO llega password:
     *   no modificamos passwordEnc.
     *
     * - Si llega password:
     *   ciframos utilizando exclusivamente el formato nuevo.
     *
     * No necesitamos descifrar la contraseña anterior para
     * sustituirla. Esto permite actualizar incluso routers
     * que todavía contienen un passwordEnc legacy.
     */
    let passwordEnc: string | undefined;

    if (command.password !== undefined) {
      passwordEnc = await this.secretCipher.encrypt(command.password);

      /**
       * Test inmediato:
       *
       * nueva
       *   -> encrypt
       *   -> decrypt
       *   -> debe ser exactamente igual.
       */
      const roundTripPassword = await this.secretCipher.decrypt(passwordEnc);

      this.logger.debug(
        [
          `[MK PASSWORD ENCRYPT] router=${command.id}`,
          `inputFingerprint=${this.fingerprint(command.password)}`,
          `roundTripFingerprint=${this.fingerprint(roundTripPassword)}`,
          `roundTripOk=${roundTripPassword === command.password}`,
        ].join(' | '),
      );
    } else {
      this.logger.debug(
        `[MK PASSWORD] router=${command.id} | password=no-enviada | credencial=conservada`,
      );
    }

    /**
     * ==========================================================
     * ACTUALIZAR ENTIDAD
     * ==========================================================
     */
    router.actualizar({
      nombre: command.nombre,

      host: command.host,

      sshPort: command.sshPort,

      usuario: command.usuario,

      descripcion: command.descripcion,

      activo: command.activo,

      oltId: command.oltId,

      /**
       * undefined significa:
       * NO cambiar la credencial existente.
       */
      passwordEnc,
    });

    /**
     * ==========================================================
     * PERSISTIR
     * ==========================================================
     */
    const updated = await this.repository.update(router);

    /**
     * ==========================================================
     * VERIFICAR LO REALMENTE GUARDADO
     * ==========================================================
     *
     * Solo tiene sentido cuando acabamos de sustituir
     * la contraseña.
     */
    if (command.password !== undefined && updated.passwordEnc) {
      const storedPlainPassword = await this.secretCipher.decrypt(
        updated.passwordEnc,
      );

      this.logger.debug(
        [
          `[MK PASSWORD PERSISTED] router=${command.id}`,
          `inputFingerprint=${this.fingerprint(command.password)}`,
          `storedFingerprint=${this.fingerprint(storedPlainPassword)}`,
          `storedEqualsInput=${storedPlainPassword === command.password}`,
        ].join(' | '),
      );
    }

    return toMikrotikRouterPublico(updated);
  }

  private fingerprint(value: string): string {
    return createHash('sha256')
      .update(value, 'utf8')
      .digest('hex')
      .slice(0, 12);
  }
}
