import { Inject, Injectable } from '@nestjs/common';
import {
  ALMACENAMIENTO_MEDIA,
  AlmacenamientoMediaFacadePort,
} from 'src/modules/almacenamiento-media/public/almacenamiento-media.facade.port';
import {
  CategoriaMedia,
  TipoMedia,
} from 'src/modules/almacenamiento-media/public/almacenamiento-media.types';
import {
  GuardarImagenComentarioInput,
  ImagenComentarioPort,
} from '../../application/ports/imagen-comentario.port';

@Injectable()
export class ImagenComentarioAlmacenamientoAdapter
  implements ImagenComentarioPort
{
  constructor(
    @Inject(ALMACENAMIENTO_MEDIA)
    private readonly almacenamiento: AlmacenamientoMediaFacadePort,
  ) {}

  async guardar(input: GuardarImagenComentarioInput): Promise<number> {
    const media = await this.almacenamiento.subirMedia({
      empresaId: input.empresaId,
      clienteId: input.clienteId ?? undefined,
      subidoPorId: input.subidoPorId,
      // Visibles por enlace, como el resto de las fotos del CRM.
      publico: true,
      categoria: CategoriaMedia.SOPORTE_TICKET,
      tipo: TipoMedia.IMAGEN,
      buffer: input.bytes,
      fileName: input.nombreArchivo,
      mime: input.mime,
      basePrefix: 'crm',
      subfolder: `tickets/${input.ticketId}/comentarios`,
    });

    return media.id;
  }

  async eliminar(mediaId: number, empresaId: number): Promise<void> {
    await this.almacenamiento.eliminarMedia({ id: mediaId, empresaId });
  }
}
