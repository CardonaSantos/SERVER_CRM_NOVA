import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { TicketFirmaEntity } from '../../domain/entities/ticket-firma.entity';
import { TicketFirmaTipo } from '../../domain/enums/ticket-firma-tipo.enum';
import {
  TicketConformidadContextoIncompletoError,
  TicketConformidadNoEncontradaError,
  TicketConformidadTicketNoEncontradoError,
  TicketFirmaDuplicadaError,
  TicketFirmaRequeridaError,
} from '../../domain/errors/ticket-soporte-conformidad.errors';
import { exigirFirmaTecnicaPermitida } from '../../domain/policies/firma-tecnico.policy';
import {
  TICKET_CONFORMIDAD_REPOSITORY,
  TicketConformidadRepositoryPort,
} from '../../domain/ports/ticket-conformidad-repository.port';
import {
  TICKET_FIRMA_REPOSITORY,
  TicketFirmaRepositoryPort,
} from '../../domain/ports/ticket-firma-repository.port';
import {
  TICKET_SOPORTE_CONTEXTO_QUERY,
  TicketSoporteContextoQueryPort,
} from '../../domain/ports/ticket-soporte-contexto-query.port';
import {
  TICKET_FIRMA_MEDIA,
  TicketFirmaMediaPort,
} from '../ports/ticket-firma-media.port';

export type RegistrarFirmaTecnicoTicketConformidadInput = {
  conformidadId: number;
  usuarioFirmanteId: number;
  nombreFirmante: string;

  /** El archivo de la firma; `null` si la petición no lo trajo. */
  firma: { bytes: Buffer; mimeType: string; nombreArchivo: string } | null;

  ipOrigen?: string | null;
  userAgent?: string | null;
};

export type RegistrarFirmaTecnicoTicketConformidadResult = {
  conformidadId: number;
  firmaId: number;
  mediaId: number;
  usuarioFirmanteId: number;
  nombreFirmante: string;
  firmadoEn: Date;
};

@Injectable()
export class RegistrarFirmaTecnicoTicketConformidadUseCase {
  private readonly logger = new Logger(
    RegistrarFirmaTecnicoTicketConformidadUseCase.name,
  );

  constructor(
    @Inject(TICKET_CONFORMIDAD_REPOSITORY)
    private readonly conformidades: TicketConformidadRepositoryPort,
    @Inject(TICKET_FIRMA_REPOSITORY)
    private readonly firmas: TicketFirmaRepositoryPort,
    @Inject(TICKET_SOPORTE_CONTEXTO_QUERY)
    private readonly tickets: TicketSoporteContextoQueryPort,
    @Inject(TICKET_FIRMA_MEDIA) private readonly media: TicketFirmaMediaPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: RegistrarFirmaTecnicoTicketConformidadInput,
  ): Promise<RegistrarFirmaTecnicoTicketConformidadResult> {
    if (!input.firma) throw new TicketFirmaRequeridaError();

    const conformidad = await this.conformidades.findById(input.conformidadId);

    if (!conformidad) throw new TicketConformidadNoEncontradaError();

    const { clienteId } = exigirFirmaTecnicaPermitida(
      conformidad,
      input.usuarioFirmanteId,
    );

    const conformidadId = conformidad.id as number;

    if (
      await this.firmas.existsByConformidadAndTipo(
        conformidadId,
        TicketFirmaTipo.TECNICO,
      )
    ) {
      throw new TicketFirmaDuplicadaError();
    }

    const ticket = await this.tickets.findContextById(conformidad.ticketId);

    if (!ticket) throw new TicketConformidadTicketNoEncontradoError();

    if (ticket.empresaId === null) {
      throw new TicketConformidadContextoIncompletoError(
        'El ticket no tiene una empresa asociada.',
      );
    }

    const empresaId = ticket.empresaId;

    // Media/Spaces queda fuera de PostgreSQL: se guarda primero y, si guardar
    // la firma falla, se compensa borrándola.
    const mediaId = await this.media.guardarFirma({
      empresaId,
      clienteId,
      ticketId: ticket.ticketId,
      conformidadId,
      subidoPorId: input.usuarioFirmanteId,
      bytes: input.firma.bytes,
      mimeType: input.firma.mimeType,
      nombreArchivo: input.firma.nombreArchivo,
      titulo: `Firma técnica - Ticket #${ticket.ticketId}`,
      descripcion: 'Firma del técnico asignado para ticket de soporte.',
    });

    try {
      const firma = TicketFirmaEntity.createTecnico(
        {
          conformidadId,
          mediaId,
          usuarioFirmanteId: input.usuarioFirmanteId,
          nombreFirmante: input.nombreFirmante,
          ipOrigen: input.ipOrigen ?? null,
          userAgent: input.userAgent ?? null,
        },
        this.reloj.ahora(),
      );

      const guardada = await this.firmas.create(firma);

      return {
        conformidadId,
        firmaId: guardada.id as number,
        mediaId: guardada.mediaId,
        usuarioFirmanteId: guardada.usuarioFirmanteId as number,
        nombreFirmante: guardada.nombreFirmante,
        firmadoEn: guardada.firmadoEn,
      };
    } catch (error) {
      await this.compensar(mediaId, empresaId);

      throw error;
    }
  }

  /** Borra la media huérfana sin tapar el error original. */
  private async compensar(mediaId: number, empresaId: number): Promise<void> {
    try {
      await this.media.eliminarFirma({ mediaId, empresaId });
    } catch {
      this.logger.warn(
        `No se pudo borrar la media ${mediaId} tras fallar la firma técnica.`,
      );
    }
  }
}
