import { TipoImagenPerfil } from '../../domain/enums/tipo-imagen-perfil.enum';
import { ImagenPerfil } from '../../domain/props/perfil-usuario.props';

export const IMAGEN_PERFIL = Symbol('IMAGEN_PERFIL');

export type SubirImagenPerfilInput = {
  empresaId: number;
  usuarioId: number;
  tipo: TipoImagenPerfil;
  bytes: Buffer;
  mime: string;
};

/** Guarda avatar y portada en el almacenamiento. */
export interface ImagenPerfilPort {
  subir(input: SubirImagenPerfilInput): Promise<ImagenPerfil>;

  /** Nunca lanza: un archivo que no se pudo borrar solo queda huérfano. */
  eliminar(imagen: ImagenPerfil): Promise<void>;
}
