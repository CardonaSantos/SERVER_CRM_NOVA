import {
  ConflictException,
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TicketFirmaEntity } from '../../domain/entities/ticket-firma.entity';

import { TicketFirmaOrigen } from '../../domain/enums/ticket-firma-origen.enum';

import {
  TICKET_CONFORMIDAD_ENLACE_REPOSITORY,
  TicketConformidadEnlaceRepositoryPort,
} from '../../domain/ports/ticket-conformidad-enlace.repository.port';

import {
  TICKET_CONFORMIDAD_REPOSITORY,
  TicketConformidadRepositoryPort,
} from '../../domain/ports/ticket-conformidad.repository.port';

import { TicketConformidadConcurrentWriteError } from '../errors/ticket-conformidad-concurrent-write.error';
import {
  TICKET_CONFORMIDAD_TOKEN_PORT,
  TicketConformidadTokenPort,
} from '../port/ticket-conformidad-token.port';
import {
  TICKET_CONFORMIDAD_TICKET_PORT,
  TicketConformidadTicketPort,
} from '../port/ticket-conformidad-ticket.port';
import {
  TICKET_FIRMA_MEDIA_PORT,
  TicketFirmaMediaPort,
} from '../port/ticket-firma-media.port';
import {
  TICKET_CONFORMIDAD_TRANSACTION_PORT,
  TicketConformidadTransactionPort,
} from '../port/ticket-conformidad-transaction.port';

export interface RegistrarFirmaClienteTicketConformidadInput {
  token: string;

  nombreFirmante: string;

  telefonoFirmante: string;

  firma: {
    bytes: Buffer;

    mimeType: string;

    nombreArchivo: string;
  };

  ipOrigen?: string | null;

  userAgent?: string | null;
}

export interface RegistrarFirmaClienteTicketConformidadOutput {
  conformidadId: number;

  resultado: string;

  firmaId: number;

  mediaId: number;

  nombreFirmante: string;

  telefonoFirmante: string | null;

  firmadoEn: Date;

  respondidoEn: Date;

  enlaceId: number;

  usadoEn: Date;
}

@Injectable()
export class RegistrarFirmaClienteTicketConformidadUseCase {
  constructor(
    @Inject(TICKET_CONFORMIDAD_TOKEN_PORT)
    private readonly tokenPort: TicketConformidadTokenPort,

    @Inject(TICKET_CONFORMIDAD_ENLACE_REPOSITORY)
    private readonly enlaceRepository: TicketConformidadEnlaceRepositoryPort,

    @Inject(TICKET_CONFORMIDAD_REPOSITORY)
    private readonly conformidadRepository: TicketConformidadRepositoryPort,

    @Inject(TICKET_CONFORMIDAD_TICKET_PORT)
    private readonly ticketPort: TicketConformidadTicketPort,

    @Inject(TICKET_FIRMA_MEDIA_PORT)
    private readonly mediaPort: TicketFirmaMediaPort,

    @Inject(TICKET_CONFORMIDAD_TRANSACTION_PORT)
    private readonly transactionPort: TicketConformidadTransactionPort,
  ) {}

  async execute(
    input: RegistrarFirmaClienteTicketConformidadInput,
  ): Promise<RegistrarFirmaClienteTicketConformidadOutput> {
    const token = input.token?.trim();

    if (!token) {
      throw new NotFoundException('El enlace de conformidad no es válido.');
    }

    /* =====================================================
     * 1. RESOLVER ENLACE
     * =================================================== */

    const tokenHash = this.tokenPort.hash(token);

    const enlace = await this.enlaceRepository.findByTokenHash(tokenHash);

    if (!enlace) {
      throw new NotFoundException('El enlace de conformidad no es válido.');
    }

    const fechaValidacion = new Date();

    if (enlace.estaRevocado()) {
      throw new GoneException('El enlace de conformidad fue revocado.');
    }

    if (enlace.estaUsado()) {
      throw new ConflictException('El enlace de conformidad ya fue utilizado.');
    }

    if (enlace.estaExpirado(fechaValidacion)) {
      throw new GoneException('El enlace de conformidad ha expirado.');
    }

    /* =====================================================
     * 2. RESOLVER CONFORMIDAD
     * =================================================== */

    const conformidad = await this.conformidadRepository.findById(
      enlace.conformidadId,
    );

    if (!conformidad) {
      throw new NotFoundException('La solicitud de conformidad no existe.');
    }

    if (!conformidad.estaPendiente()) {
      throw new ConflictException(
        'La solicitud de conformidad ya fue respondida.',
      );
    }

    const conformidadId = conformidad.id;

    if (conformidadId === null) {
      throw new Error('La conformidad recuperada no posee id persistido.');
    }

    /*
     * Usamos el cliente almacenado en la conformidad.
     *
     * Es el snapshot correspondiente a este ciclo, no
     * necesariamente el cliente actual que pueda quedar
     * relacionado al TicketSoporte posteriormente.
     */
    const clienteId = conformidad.clienteId;

    if (clienteId === null) {
      throw new ConflictException(
        'La solicitud de conformidad no tiene un cliente asociado.',
      );
    }

    /* =====================================================
     * 3. OBTENER EMPRESA DEL TICKET
     * =================================================== */

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

    /* =====================================================
     * 4. GUARDAR LA FIRMA COMO MEDIA
     * =================================================== */

    const media = await this.mediaPort.guardarFirma({
      empresaId,

      clienteId,

      ticketId: ticket.ticketId,

      conformidadId,

      subidoPorId: null,

      bytes: input.firma.bytes,

      mimeType: input.firma.mimeType,

      nombreArchivo: input.firma.nombreArchivo,

      titulo: `Firma de conformidad - Ticket #${ticket.ticketId}`,

      descripcion: 'Firma del cliente para conformidad de ticket de soporte.',
    });

    /*
     * Desde aquí Media ya existe.
     *
     * Cualquier fallo posterior debe intentar compensarse
     * eliminando esa Media.
     */

    let persisted: Awaited<
      ReturnType<TicketConformidadTransactionPort['persistirFirmaCliente']>
    >;

    try {
      /*
       * Volvemos a obtener la hora DESPUÉS del upload.
       *
       * Un upload puede tardar y el enlace podría haber
       * expirado durante ese tiempo.
       */
      const fechaOperacion = new Date();

      if (enlace.estaExpirado(fechaOperacion)) {
        throw new GoneException('El enlace de conformidad ha expirado.');
      }

      /* ===================================================
       * 5. CREAR ENTITY DE FIRMA
       * ================================================= */

      const firma = TicketFirmaEntity.createCliente({
        conformidadId,

        mediaId: media.mediaId,

        nombreFirmante: input.nombreFirmante,

        telefonoFirmante: input.telefonoFirmante,

        origen: TicketFirmaOrigen.PUBLICO,

        ipOrigen: input.ipOrigen ?? null,

        userAgent: input.userAgent ?? null,
      });

      /* ===================================================
       * 6. TRANSICIONES DE DOMINIO
       * ================================================= */

      conformidad.marcarConforme(fechaOperacion);

      enlace.marcarUsado(fechaOperacion);

      /* ===================================================
       * 7. TRANSACCIÓN POSTGRESQL
       * ================================================= */

      persisted = await this.transactionPort.persistirFirmaCliente({
        conformidad,

        enlace,

        firma,

        fechaOperacion,
      });
    } catch (error) {
      /*
       * Media/Spaces están fuera de la transacción
       * TicketFirma + Conformidad + Enlace.
       *
       * Intentamos compensar.
       */
      try {
        await this.mediaPort.eliminarFirma({
          mediaId: media.mediaId,
          empresaId,
        });
      } catch {
        /*
         * No sustituimos el error original.
         *
         * Más adelante podremos agregar Logger/Auditoría
         * para detectar compensaciones fallidas.
         */
      }

      if (error instanceof TicketConformidadConcurrentWriteError) {
        throw new ConflictException(
          'La solicitud ya fue respondida o el enlace dejó de estar disponible.',
        );
      }

      throw error;
    }

    /* =====================================================
     * 8. VALIDAR RESULTADO PERSISTIDO
     * =================================================== */

    const persistedConformidadId = persisted.conformidad.id;

    const persistedFirmaId = persisted.firma.id;

    const persistedEnlaceId = persisted.enlace.id;

    const respondidoEn = persisted.conformidad.respondidoEn;

    const usadoEn = persisted.enlace.usadoEn;

    if (
      persistedConformidadId === null ||
      persistedFirmaId === null ||
      persistedEnlaceId === null ||
      respondidoEn === null ||
      usadoEn === null
    ) {
      /*
       * Llegados aquí la transacción YA hizo commit.
       *
       * Por eso deliberadamente esta validación está
       * fuera del catch de compensación de Media.
       */
      throw new Error(
        'La firma del cliente fue persistida en un estado inconsistente.',
      );
    }

    return {
      conformidadId: persistedConformidadId,

      resultado: String(persisted.conformidad.resultado),

      firmaId: persistedFirmaId,

      mediaId: persisted.firma.mediaId,

      nombreFirmante: persisted.firma.nombreFirmante,

      telefonoFirmante: persisted.firma.telefonoFirmante,

      firmadoEn: persisted.firma.firmadoEn,

      respondidoEn,

      enlaceId: persistedEnlaceId,

      usadoEn,
    };
  }
}
