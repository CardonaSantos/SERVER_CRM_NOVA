import {
  ConflictException,
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TicketConformidadResultado } from '../../domain/enums/ticket-conformidad-resultado.enum';

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
  TICKET_CONFORMIDAD_TRANSACTION_PORT,
  TicketConformidadTransactionPort,
} from '../port/ticket-conformidad-transaction.port';

export interface RequerirRetrabajoTicketConformidadInput {
  token: string;
}

export interface RequerirRetrabajoTicketConformidadOutput {
  conformidadId: number;

  resultado: TicketConformidadResultado;

  respondidoEn: Date;

  enlaceId: number;

  usadoEn: Date;
}

@Injectable()
export class RequerirRetrabajoTicketConformidadUseCase {
  constructor(
    @Inject(TICKET_CONFORMIDAD_TOKEN_PORT)
    private readonly tokenPort: TicketConformidadTokenPort,

    @Inject(TICKET_CONFORMIDAD_ENLACE_REPOSITORY)
    private readonly enlaceRepository: TicketConformidadEnlaceRepositoryPort,

    @Inject(TICKET_CONFORMIDAD_REPOSITORY)
    private readonly conformidadRepository: TicketConformidadRepositoryPort,

    @Inject(TICKET_CONFORMIDAD_TRANSACTION_PORT)
    private readonly transactionPort: TicketConformidadTransactionPort,
  ) {}

  async execute(
    input: RequerirRetrabajoTicketConformidadInput,
  ): Promise<RequerirRetrabajoTicketConformidadOutput> {
    const token = input.token?.trim();

    if (!token) {
      throw new NotFoundException('El enlace de conformidad no es válido.');
    }

    const tokenHash = this.tokenPort.hash(token);

    const enlace = await this.enlaceRepository.findByTokenHash(tokenHash);

    if (!enlace) {
      throw new NotFoundException('El enlace de conformidad no es válido.');
    }

    const now = new Date();

    /*
     * Estas validaciones nos permiten devolver mensajes
     * apropiados antes de intentar la transacción.
     *
     * La transacción vuelve a comprobarlas para evitar
     * condiciones de carrera.
     */

    if (enlace.estaRevocado()) {
      throw new GoneException('El enlace de conformidad fue revocado.');
    }

    if (enlace.estaUsado()) {
      throw new ConflictException('El enlace de conformidad ya fue utilizado.');
    }

    if (enlace.estaExpirado(now)) {
      throw new GoneException('El enlace de conformidad ha expirado.');
    }

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

    /*
     * Aplicamos primero el comportamiento en dominio.
     */
    conformidad.requerirRetrabajo(now);

    enlace.marcarUsado(now);

    try {
      const persisted = await this.transactionPort.persistirRetrabajo({
        conformidad,
        enlace,

        fechaOperacion: now,
      });

      const persistedConformidadId = persisted.conformidad.id;

      const persistedEnlaceId = persisted.enlace.id;

      const respondidoEn = persisted.conformidad.respondidoEn;

      const usadoEn = persisted.enlace.usadoEn;

      if (
        persistedConformidadId === null ||
        persistedEnlaceId === null ||
        respondidoEn === null ||
        usadoEn === null
      ) {
        throw new Error(
          'El retrabajo fue persistido en un estado inconsistente.',
        );
      }

      return {
        conformidadId: persistedConformidadId,

        resultado: persisted.conformidad.resultado,

        respondidoEn,

        enlaceId: persistedEnlaceId,

        usadoEn,
      };
    } catch (error) {
      if (error instanceof TicketConformidadConcurrentWriteError) {
        throw new ConflictException(
          'La solicitud ya fue respondida o el enlace dejó de estar disponible.',
        );
      }

      throw error;
    }
  }
}
