import { Inject, Injectable } from '@nestjs/common';
import { CategoriaMedia, TipoMedia } from '@prisma/client';
import {
  EliminarTicketFirmaMediaInput,
  GuardarTicketFirmaMediaInput,
  GuardarTicketFirmaMediaOutput,
  TicketFirmaMediaPort,
} from '../../application/port/ticket-firma-media.port';
import {
  ELIMINAR_MEDIA_USECASE,
  SUBIR_MEDIA_USECASE,
} from 'src/modules/digital-ocean-media/tokens/tokens';
import { SubirMediaUseCase } from 'src/modules/digital-ocean-media/application/use-cases/subir-media.usecase';
import { EliminarMediaUseCase } from 'src/modules/digital-ocean-media/application/use-cases/eliminar-media.usecase';

@Injectable()
export class TicketFirmaMediaAdapter implements TicketFirmaMediaPort {
  constructor(
    @Inject(SUBIR_MEDIA_USECASE)
    private readonly subirMedia: SubirMediaUseCase,

    @Inject(ELIMINAR_MEDIA_USECASE)
    private readonly eliminarMedia: EliminarMediaUseCase,
  ) {}

  async guardarFirma(
    input: GuardarTicketFirmaMediaInput,
  ): Promise<GuardarTicketFirmaMediaOutput> {
    const result = await this.subirMedia.execute({
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
    await this.eliminarMedia.execute({
      id: input.mediaId,

      empresaId: input.empresaId,

      hardDelete: true,
    });
  }
}
