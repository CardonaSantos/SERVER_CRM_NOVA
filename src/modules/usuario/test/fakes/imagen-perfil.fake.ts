import {
  ImagenPerfilPort,
  SubirImagenPerfilInput,
} from '../../application/ports/imagen-perfil.port';
import { ImagenPerfil } from '../../domain/props/perfil-usuario.props';

/** Almacenamiento en memoria: lo subido y lo borrado, por llave. */
export class ImagenPerfilFake implements ImagenPerfilPort {
  readonly subidas: string[] = [];
  readonly borradas: string[] = [];
  private contador = 0;

  subir(input: SubirImagenPerfilInput): Promise<ImagenPerfil> {
    const key = `usuarios/${input.tipo}/${input.usuarioId}-${++this.contador}`;
    this.subidas.push(key);

    return Promise.resolve({
      url: `https://cdn.test/${key}`,
      key,
      bucket: 'bucket',
      mimeType: input.mime,
      size: input.bytes.length,
    });
  }

  eliminar(imagen: ImagenPerfil): Promise<void> {
    this.borradas.push(imagen.key);
    return Promise.resolve();
  }
}
