import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { UsuarioEntity } from '../../domain/entities/usuario.entity';
import { UsuarioNoEncontradoError } from '../../domain/errors/usuario.errors';
import {
  USUARIO_REPOSITORY,
  UsuarioRepositoryPort,
} from '../../domain/ports/usuario-repository.port';

export type ActivarUsuarioInput = { usuarioId: number };

@Injectable()
export class ActivarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarios: UsuarioRepositoryPort,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  execute(input: ActivarUsuarioInput): Promise<UsuarioEntity> {
    return this.unidad.ejecutar(async () => {
      await this.usuarios.bloquearParaModificar(input.usuarioId);
      const usuario = await this.usuarios.findById(input.usuarioId);
      if (!usuario) throw new UsuarioNoEncontradoError();

      return usuario.activar(this.reloj.ahora())
        ? this.usuarios.update(usuario)
        : usuario;
    });
  }
}
