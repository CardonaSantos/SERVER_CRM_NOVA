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
  EliminarTicketFirmaMediaInput,
  GuardarTicketFirmaMediaInput,
  TicketFirmaMediaPort,
} from '../../application/ports/ticket-firma-media.port';

@Injectable()
export class TicketFirmaMediaAlmacenamientoAdapter
  implements TicketFirmaMediaPort
{
  constructor(
    @Inject(ALMACENAMIENTO_MEDIA)
    private readonly almacenamiento: AlmacenamientoMediaFacadePort,
  ) {}

  async guardarFirma(input: GuardarTicketFirmaMediaInput): Promise<number> {
    const media = await this.almacenamiento.subirMedia({
      empresaId: input.empresaId,
      clienteId: input.clienteId,
      subidoPorId: input.subidoPorId,
      publico: false,
      categoria: CategoriaMedia.SOPORTE_TICKET,
      tipo: TipoMedia.IMAGEN,
      buffer: input.bytes,
      fileName: input.nombreArchivo,
      mime: input.mimeType,
      titulo: input.titulo,
      descripcion: input.descripcion,
      basePrefix: 'crm',
      subfolder:
        `firmas/tickets/${input.ticketId}` +
        `/conformidades/${input.conformidadId}`,
    });

    return media.id;
  }

  async eliminarFirma(input: EliminarTicketFirmaMediaInput): Promise<void> {
    await this.almacenamiento.eliminarMedia({
      id: input.mediaId,
      empresaId: input.empresaId,
    });
  }
}
