import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { TipoImagenPerfil } from '../../domain/enums/tipo-imagen-perfil.enum';
import {
  PERFIL_USUARIO_REPOSITORY,
  PerfilUsuarioRepositoryPort,
} from '../../domain/ports/perfil-usuario-repository.port';
import {
  USUARIO_REPOSITORY,
  UsuarioRepositoryPort,
} from '../../domain/ports/usuario-repository.port';
import { IMAGEN_PERFIL, ImagenPerfilPort } from '../ports/imagen-perfil.port';
import { MiPerfil, MiPerfilService } from '../services/mi-perfil.service';

export type QuitarImagenPerfilInput = {
  usuarioId: number;
  tipo: TipoImagenPerfil;
};

/** Sin imagen no es error: responde el perfil igual. */
@Injectable()
export class QuitarImagenPerfilUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarios: UsuarioRepositoryPort,
    @Inject(PERFIL_USUARIO_REPOSITORY)
    private readonly perfiles: PerfilUsuarioRepositoryPort,
    @Inject(IMAGEN_PERFIL) private readonly imagenes: ImagenPerfilPort,
    private readonly miPerfil: MiPerfilService,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: QuitarImagenPerfilInput): Promise<MiPerfil> {
    const quitada = await this.unidad.ejecutar(async () => {
      await this.usuarios.bloquearParaModificar(input.usuarioId);
      await this.miPerfil.usuarioVigente(input.usuarioId);

      const perfil = await this.perfiles.findByUsuarioId(input.usuarioId);
      const imagen = perfil?.quitarImagen(input.tipo, this.reloj.ahora());
      if (!perfil || !imagen) return null;

      await this.perfiles.guardar(perfil);
      return imagen;
    });

    // Después de guardar: si el borrado falla, solo queda un archivo huérfano.
    if (quitada) await this.imagenes.eliminar(quitada);

    return this.miPerfil.cargar(input.usuarioId);
  }
}
