import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TicketFirmaEntity } from '../../domain/entities/ticket-firma.entity';
import { TicketFirmaTipo } from '../../domain/enums/ticket-firma-tipo.enum';
import {
  TICKET_CONFORMIDAD_REPOSITORY,
  TicketConformidadRepositoryPort,
} from '../../domain/ports/ticket-conformidad.repository.port';
import {
  TICKET_FIRMA_REPOSITORY,
  TicketFirmaRepositoryPort,
} from '../../domain/ports/ticket-firma.repository.port';
import {
  TICKET_CONFORMIDAD_TICKET_PORT,
  TicketConformidadTicketPort,
} from '../port/ticket-conformidad-ticket.port';
import {
  TICKET_FIRMA_MEDIA_PORT,
  TicketFirmaMediaPort,
} from '../port/ticket-firma-media.port';

export interface RegistrarFirmaTecnicoTicketConformidadInput {
  conformidadId: number;

  usuarioFirmanteId: number;

  nombreFirmante: string;

  firma: {
    bytes: Buffer;

    mimeType: string;

    nombreArchivo: string;
  };

  ipOrigen?: string | null;

  userAgent?: string | null;
}

export interface RegistrarFirmaTecnicoTicketConformidadOutput {
  conformidadId: number;

  firmaId: number;

  mediaId: number;

  usuarioFirmanteId: number;

  nombreFirmante: string;

  firmadoEn: Date;
}

@Injectable()
export class RegistrarFirmaTecnicoTicketConformidadUseCase {
  constructor(
    @Inject(TICKET_CONFORMIDAD_REPOSITORY)
    private readonly conformidadRepository: TicketConformidadRepositoryPort,

    @Inject(TICKET_FIRMA_REPOSITORY)
    private readonly firmaRepository: TicketFirmaRepositoryPort,

    @Inject(TICKET_CONFORMIDAD_TICKET_PORT)
    private readonly ticketPort: TicketConformidadTicketPort,

    @Inject(TICKET_FIRMA_MEDIA_PORT)
    private readonly mediaPort: TicketFirmaMediaPort,
  ) {}

  async execute(
    input: RegistrarFirmaTecnicoTicketConformidadInput,
  ): Promise<RegistrarFirmaTecnicoTicketConformidadOutput> {
    const conformidad = await this.conformidadRepository.findById(
      input.conformidadId,
    );

    if (!conformidad) {
      throw new NotFoundException(
        `No existe la conformidad ${input.conformidadId}.`,
      );
    }

    const conformidadId = conformidad.id;

    if (conformidadId === null) {
      throw new Error('La conformidad recuperada no posee id persistido.');
    }

    /*
     * Puede firmarse mientras el ciclo está:
     *
     * - PENDIENTE
     * - CONFORME
     *
     * Esto permite que técnico y cliente firmen
     * en cualquier orden.
     *
     * Si el cliente solicitó retrabajo, ese ciclo
     * ya no debe recibir una firma técnica nueva.
     */
    if (conformidad.requiereRetrabajo()) {
      throw new ConflictException(
        'No puede registrarse la firma técnica en una conformidad que requiere retrabajo.',
      );
    }

    const tecnicoAsignadoId = conformidad.tecnicoAsignadoId;

    if (tecnicoAsignadoId === null) {
      throw new ConflictException(
        'La conformidad no posee un técnico asignado.',
      );
    }

    if (tecnicoAsignadoId !== input.usuarioFirmanteId) {
      throw new ForbiddenException(
        'La conformidad no pertenece al técnico autenticado.',
      );
    }

    //  * 3. EVITAR FIRMA TÉCNICA DUPLICADA

    const yaTieneFirmaTecnico =
      await this.firmaRepository.existsByConformidadAndTipo(
        conformidadId,
        TicketFirmaTipo.TECNICO,
      );

    if (yaTieneFirmaTecnico) {
      throw new ConflictException('La conformidad ya posee una firma técnica.');
    }

    //  * 4. RESOLVER CLIENTE DEL CICLO

    const clienteId = conformidad.clienteId;

    if (clienteId === null) {
      throw new ConflictException(
        'La conformidad no tiene un cliente asociado.',
      );
    }

    //  * 5. OBTENER CONTEXTO DEL TICKET

    const ticket = await this.ticketPort.findContextById(conformidad.ticketId);

    if (!ticket) {
      throw new NotFoundException(
        'El ticket asociado a la conformidad no existe.',
      );
    }

    if (ticket.empresaId === null) {
      throw new ConflictException('El ticket no tiene una empresa asociada.');
    }

    const empresaId = ticket.empresaId;

    //  * 6. GUARDAR FIRMA EN MEDIA / SPACES

    const media = await this.mediaPort.guardarFirma({
      empresaId,

      clienteId,

      ticketId: ticket.ticketId,

      conformidadId,

      /*
       * A diferencia de la firma pública del cliente,
       * aquí sí conocemos al usuario que subió el archivo.
       */
      subidoPorId: input.usuarioFirmanteId,

      bytes: input.firma.bytes,

      mimeType: input.firma.mimeType,

      nombreArchivo: input.firma.nombreArchivo,

      titulo: `Firma técnica - Ticket #${ticket.ticketId}`,

      descripcion: 'Firma del técnico asignado para ticket de soporte.',
    });

    /*
     * Media/Spaces queda fuera de PostgreSQL.
     *
     * Si la persistencia de TicketFirma falla,
     * intentamos eliminar el archivo creado.
     */

    let firmaPersistida: TicketFirmaEntity;

    try {
      //    * 7. CREAR FIRMA DE DOMINIO

      const firma = TicketFirmaEntity.createTecnico({
        conformidadId,

        mediaId: media.mediaId,

        usuarioFirmanteId: input.usuarioFirmanteId,

        nombreFirmante: input.nombreFirmante,

        ipOrigen: input.ipOrigen ?? null,

        userAgent: input.userAgent ?? null,
      });

      //    * 8. PERSISTIR FIRMA

      firmaPersistida = await this.firmaRepository.create(firma);
    } catch (error) {
      try {
        await this.mediaPort.eliminarFirma({
          mediaId: media.mediaId,
          empresaId,
        });
      } catch {
        /*
         * No sustituimos el error original.
         */
      }

      throw error;
    }

    //  * 9. VALIDAR RESULTADO

    const firmaId = firmaPersistida.id;

    if (firmaId === null) {
      throw new Error('La firma técnica fue persistida sin id.');
    }

    const usuarioFirmanteId = firmaPersistida.usuarioFirmanteId;

    if (usuarioFirmanteId === null) {
      throw new Error('La firma técnica fue persistida sin usuario firmante.');
    }

    return {
      conformidadId,

      firmaId,

      mediaId: firmaPersistida.mediaId,

      usuarioFirmanteId,

      nombreFirmante: firmaPersistida.nombreFirmante,

      firmadoEn: firmaPersistida.firmadoEn,
    };
  }
}
