import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { UsuarioEntity } from '../../domain/entities/usuario.entity';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';
import {
  UsuarioCorreoDuplicadoError,
  UsuarioNoEncontradoError,
} from '../../domain/errors/usuario.errors';
import {
  asegurarQueNoEsUnoMismo,
  asegurarQueQuedaSuperAdmin,
  situacionDe,
} from '../../domain/policies/super-admin.policy';
import {
  USUARIO_REPOSITORY,
  UsuarioRepositoryPort,
} from '../../domain/ports/usuario-repository.port';

export type ActualizarUsuarioInput = {
  actorId: number;
  usuarioId: number;
  nombre?: string;
  correo?: string;
  telefono?: string | null;
  rol?: RolUsuario;
};

/** Datos y rol de cualquier usuario. Contraseña y estado tienen su propia ruta. */
@Injectable()
export class ActualizarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarios: UsuarioRepositoryPort,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  execute(input: ActualizarUsuarioInput): Promise<UsuarioEntity> {
    return this.unidad.ejecutar(async () => {
      if (input.rol !== undefined) await this.usuarios.bloquearSuperAdmins();
      await this.usuarios.bloquearParaModificar(input.usuarioId);

      const usuario = await this.usuarios.findById(input.usuarioId);
      if (!usuario) throw new UsuarioNoEncontradoError();
      usuario.asegurarVigente();

      const ahora = this.reloj.ahora();
      const antes = situacionDe(usuario);
      const correoAnterior = usuario.correo;

      const datos = usuario.actualizarDatos(
        {
          nombre: input.nombre,
          correo: input.correo,
          telefono: input.telefono,
        },
        ahora,
      );
      if (usuario.correo !== correoAnterior) {
        const otro = await this.usuarios.findByCorreo(usuario.correo);
        if (otro && otro.id !== usuario.id) {
          throw new UsuarioCorreoDuplicadoError();
        }
      }

      const rol =
        input.rol !== undefined && usuario.cambiarRol(input.rol, ahora);
      if (rol) {
        asegurarQueNoEsUnoMismo(input.actorId, input.usuarioId);
        asegurarQueQuedaSuperAdmin(
          antes,
          situacionDe(usuario),
          await this.usuarios.contarSuperAdminsActivos(),
        );
      }

      return datos || rol ? this.usuarios.update(usuario) : usuario;
    });
  }
}
