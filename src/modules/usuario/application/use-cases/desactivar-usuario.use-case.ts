import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { UsuarioEntity } from '../../domain/entities/usuario.entity';
import { UsuarioNoEncontradoError } from '../../domain/errors/usuario.errors';
import {
  asegurarQueNoEsUnoMismo,
  asegurarQueQuedaSuperAdmin,
  situacionDe,
} from '../../domain/policies/super-admin.policy';
import {
  USUARIO_REPOSITORY,
  UsuarioRepositoryPort,
} from '../../domain/ports/usuario-repository.port';
import {
  SESIONES_USUARIO,
  SesionesUsuarioPort,
} from '../ports/sesiones-usuario.port';

export type DesactivarUsuarioInput = { actorId: number; usuarioId: number };

/** Ya no puede entrar: se cierran sus sesiones. Lo que registró se conserva. */
@Injectable()
export class DesactivarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarios: UsuarioRepositoryPort,
    @Inject(SESIONES_USUARIO) private readonly sesiones: SesionesUsuarioPort,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: DesactivarUsuarioInput): Promise<UsuarioEntity> {
    asegurarQueNoEsUnoMismo(input.actorId, input.usuarioId);

    const usuario = await this.unidad.ejecutar(async () => {
      await this.usuarios.bloquearSuperAdmins();
      await this.usuarios.bloquearParaModificar(input.usuarioId);
      const usuario = await this.usuarios.findById(input.usuarioId);
      if (!usuario) throw new UsuarioNoEncontradoError();

      const antes = situacionDe(usuario);
      if (!usuario.desactivar(this.reloj.ahora())) return usuario;
      asegurarQueQuedaSuperAdmin(
        antes,
        situacionDe(usuario),
        await this.usuarios.contarSuperAdminsActivos(),
      );

      return this.usuarios.update(usuario);
    });

    await this.sesiones.cerrarTodas(input.usuarioId, 'USUARIO_INACTIVO');
    return usuario;
  }
}
