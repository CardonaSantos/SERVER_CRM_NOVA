import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { stepUpVigentePara } from 'src/auth/step-up/contexto-reautenticacion';
import {
  HASH_CONTRASENA,
  HashContrasenaPort,
} from '../../application/ports/hash-contrasena.port';
import { ReautenticacionUsuarioPort } from '../../application/ports/reautenticacion-usuario.port';
import {
  USUARIO_REPOSITORY,
  UsuarioRepositoryPort,
} from '../../domain/ports/usuario-repository.port';

/**
 * Igual que `AuthService.reautenticarUsuarioPorId`, sin depender de `AuthModule`
 * (que importa este módulo): step-up vigente o contraseña del propio usuario.
 */
@Injectable()
export class ReautenticacionStepUpAdapter
  implements ReautenticacionUsuarioPort
{
  private readonly logger = new Logger(ReautenticacionStepUpAdapter.name);

  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarios: UsuarioRepositoryPort,
    @Inject(HASH_CONTRASENA) private readonly hash: HashContrasenaPort,
  ) {}

  async confirmar(usuarioId: number, contrasenaActual: string): Promise<void> {
    if (stepUpVigentePara(usuarioId)) return;

    const usuario =
      typeof contrasenaActual === 'string' && contrasenaActual.trim()
        ? await this.usuarios.findById(usuarioId)
        : null;
    const valida =
      !!usuario &&
      usuario.activo &&
      !usuario.eliminado &&
      (await this.hash.verify(contrasenaActual, usuario.contrasenaHash));

    if (!valida) {
      this.logger.warn(`Reautenticación fallida para el usuario ${usuarioId}.`);
      throw new UnauthorizedException(
        'No se pudo confirmar la identidad del usuario.',
      );
    }
  }
}
