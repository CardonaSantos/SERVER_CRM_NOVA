import { Inject, Injectable } from '@nestjs/common';
import {
  EliminarTicketFirmaMediaInput,
  GuardarTicketFirmaMediaInput,
  GuardarTicketFirmaMediaOutput,
  TicketFirmaMediaPort,
} from '../../application/port/ticket-firma-media.port';
import {
  ALMACENAMIENTO_MEDIA,
  AlmacenamientoMediaFacadePort,
} from 'src/modules/almacenamiento-media/public/almacenamiento-media.facade.port';
import {
  CategoriaMedia,
  TipoMedia,
} from 'src/modules/almacenamiento-media/public/almacenamiento-media.types';

@Injectable()
export class TicketFirmaMediaAdapter implements TicketFirmaMediaPort {
  constructor(
    @Inject(ALMACENAMIENTO_MEDIA)
    private readonly almacenamiento: AlmacenamientoMediaFacadePort,
  ) {}

  async guardarFirma(
    input: GuardarTicketFirmaMediaInput,
  ): Promise<GuardarTicketFirmaMediaOutput> {
    const result = await this.almacenamiento.subirMedia({
      empresaId: input.empresaId,

      clienteId: input.clienteId,

      subidoPorId: input.subidoPorId ?? undefined,

      publico: false,

      categoria: CategoriaMedia.SOPORTE_TICKET,

      tipo: TipoMedia.IMAGEN,

      buffer: input.bytes,

      fileName: input.nombreArchivo,

      mime: input.mimeType,

      titulo: input.titulo ?? undefined,

      descripcion: input.descripcion ?? undefined,

      basePrefix: 'crm',

      subfolder:
        `firmas/tickets/${input.ticketId}` +
        `/conformidades/${input.conformidadId}`,
    });

    return {
      mediaId: result.id,

      bucket: result.bucket,

      key: result.key,

      cdnUrl: result.cdnUrl ?? null,
    };
  }

  async eliminarFirma(input: EliminarTicketFirmaMediaInput): Promise<void> {
    await this.almacenamiento.eliminarMedia({
      id: input.mediaId,

      empresaId: input.empresaId,
    });
  }
}
