import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ALMACENAMIENTO_MEDIA,
  AlmacenamientoMediaFacadePort,
} from 'src/modules/almacenamiento-media/public/almacenamiento-media.facade.port';
import {
  ImagenPerfilPort,
  SubirImagenPerfilInput,
} from '../../application/ports/imagen-perfil.port';
import { ImagenPerfil } from '../../domain/props/perfil-usuario.props';

@Injectable()
export class ImagenPerfilAlmacenamientoAdapter implements ImagenPerfilPort {
  private readonly logger = new Logger(ImagenPerfilAlmacenamientoAdapter.name);

  constructor(
    @Inject(ALMACENAMIENTO_MEDIA)
    private readonly almacenamiento: AlmacenamientoMediaFacadePort,
  ) {}

  async subir(input: SubirImagenPerfilInput): Promise<ImagenPerfil> {
    // Misma carpeta que antes: `usuarios/perfil-avatar` y `usuarios/perfil-portada`.
    const subido = await this.almacenamiento.subirArchivo({
      buffer: input.bytes,
      mime: input.mime,
      empresaId: input.empresaId,
      tipo: `perfil-${input.tipo}`,
      basePrefix: 'usuarios',
    });

    return {
      url: subido.cdnUrl,
      key: subido.key,
      bucket: subido.bucket,
      mimeType: subido.mimeType,
      size: subido.size ?? input.bytes.length,
    };
  }

  async eliminar(imagen: ImagenPerfil): Promise<void> {
    try {
      await this.almacenamiento.eliminarArchivo({
        bucket: imagen.bucket,
        key: imagen.key,
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo borrar una imagen de perfil del almacenamiento: ${
          error instanceof Error ? error.message : 'error desconocido'
        }`,
      );
    }
  }
}
