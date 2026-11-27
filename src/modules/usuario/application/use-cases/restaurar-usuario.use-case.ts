import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { UsuarioEntity } from '../../domain/entities/usuario.entity';
import {
  UsuarioCorreoEnUsoError,
  UsuarioNoEncontradoError,
} from '../../domain/errors/usuario.errors';
import { normalizarCorreo } from '../../domain/policies/datos-usuario.policy';
import {
  USUARIO_REPOSITORY,
  UsuarioRepositoryPort,
} from '../../domain/ports/usuario-repository.port';

export type RestaurarUsuarioInput = {
  usuarioId: number;
  /** Si su correo ya lo usa otra cuenta, uno nuevo. */
  correo?: string;
};

/** Vuelve desactivado, con su contraseña de antes: se activa aparte. */
@Injectable()
export class RestaurarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarios: UsuarioRepositoryPort,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  execute(input: RestaurarUsuarioInput): Promise<UsuarioEntity> {
    return this.unidad.ejecutar(async () => {
      await this.usuarios.bloquearParaModificar(input.usuarioId);
      const usuario = await this.usuarios.findById(input.usuarioId);
      if (!usuario) throw new UsuarioNoEncontradoError();

      const correo = normalizarCorreo(input.correo ?? usuario.correoOriginal);
      usuario.restaurar(correo, this.reloj.ahora());
      if (await this.usuarios.findByCorreo(correo)) {
        throw new UsuarioCorreoEnUsoError();
      }

      return this.usuarios.update(usuario);
    });
  }
}
