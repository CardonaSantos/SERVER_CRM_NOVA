import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { PerfilUsuarioEntity } from '../../domain/entities/perfil-usuario.entity';
import { TipoImagenPerfil } from '../../domain/enums/tipo-imagen-perfil.enum';
import { validarImagenPerfil } from '../../domain/policies/imagen-perfil.policy';
import {
  PERFIL_USUARIO_REPOSITORY,
  PerfilUsuarioRepositoryPort,
} from '../../domain/ports/perfil-usuario-repository.port';
import {
  USUARIO_REPOSITORY,
  UsuarioRepositoryPort,
} from '../../domain/ports/usuario-repository.port';
import { ImagenPerfil } from '../../domain/props/perfil-usuario.props';
import { IMAGEN_PERFIL, ImagenPerfilPort } from '../ports/imagen-perfil.port';
import { MiPerfil, MiPerfilService } from '../services/mi-perfil.service';

export type CambiarImagenPerfilInput = {
  usuarioId: number;
  empresaId: number;
  tipo: TipoImagenPerfil;
  bytes: Buffer | undefined;
};

/**
 * Sube la imagen nueva antes de tocar la anterior: si algo falla, el perfil
 * sigue mostrando la que tenía y la nueva se borra.
 */
@Injectable()
export class CambiarImagenPerfilUseCase {
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

  async execute(input: CambiarImagenPerfilInput): Promise<MiPerfil> {
    const mime = validarImagenPerfil(input.bytes);
    await this.miPerfil.usuarioVigente(input.usuarioId);

    const nueva = await this.imagenes.subir({
      empresaId: input.empresaId,
      usuarioId: input.usuarioId,
      tipo: input.tipo,
      bytes: input.bytes!,
      mime,
    });

    let anterior: ImagenPerfil | null;
    try {
      anterior = await this.unidad.ejecutar(async () => {
        await this.usuarios.bloquearParaModificar(input.usuarioId);
        await this.miPerfil.usuarioVigente(input.usuarioId);
        const ahora = this.reloj.ahora();
        const perfil =
          (await this.perfiles.findByUsuarioId(input.usuarioId)) ??
          PerfilUsuarioEntity.create(input.usuarioId, ahora);

        const reemplazada = perfil.ponerImagen(input.tipo, nueva, ahora);
        await this.perfiles.guardar(perfil);

        return reemplazada;
      });
    } catch (error) {
      await this.imagenes.eliminar(nueva);
      throw error;
    }

    if (anterior) await this.imagenes.eliminar(anterior);

    return this.miPerfil.cargar(input.usuarioId);
  }
}
