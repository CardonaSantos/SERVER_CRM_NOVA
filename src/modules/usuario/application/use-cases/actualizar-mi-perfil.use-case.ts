import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { PerfilUsuarioEntity } from '../../domain/entities/perfil-usuario.entity';
import {
  PERFIL_USUARIO_REPOSITORY,
  PerfilUsuarioRepositoryPort,
} from '../../domain/ports/perfil-usuario-repository.port';
import {
  USUARIO_REPOSITORY,
  UsuarioRepositoryPort,
} from '../../domain/ports/usuario-repository.port';
import { MiPerfil, MiPerfilService } from '../services/mi-perfil.service';

/** Correo y rol no están: solo los cambia el super administrador. */
export type ActualizarMiPerfilInput = {
  usuarioId: number;
  nombre?: string;
  telefono?: string | null;
  bio?: string | null;
  notificarWhatsApp?: boolean;
  notificarPush?: boolean;
  notificarSonido?: boolean;
};

@Injectable()
export class ActualizarMiPerfilUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarios: UsuarioRepositoryPort,
    @Inject(PERFIL_USUARIO_REPOSITORY)
    private readonly perfiles: PerfilUsuarioRepositoryPort,
    private readonly miPerfil: MiPerfilService,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: ActualizarMiPerfilInput): Promise<MiPerfil> {
    const { usuarioId, nombre, telefono, ...preferencias } = input;

    await this.unidad.ejecutar(async () => {
      await this.usuarios.bloquearParaModificar(usuarioId);
      const usuario = await this.miPerfil.usuarioVigente(usuarioId);
      const ahora = this.reloj.ahora();

      if (usuario.actualizarDatos({ nombre, telefono }, ahora)) {
        await this.usuarios.update(usuario);
      }

      if (Object.values(preferencias).some((valor) => valor !== undefined)) {
        const perfil =
          (await this.perfiles.findByUsuarioId(usuarioId)) ??
          PerfilUsuarioEntity.create(usuarioId, ahora);
        perfil.actualizar(preferencias, ahora);
        await this.perfiles.guardar(perfil);
      }
    });

    return this.miPerfil.cargar(usuarioId);
  }
}
