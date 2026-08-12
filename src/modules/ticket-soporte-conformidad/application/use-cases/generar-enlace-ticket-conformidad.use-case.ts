import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TicketConformidadCanal } from '../../domain/enums/ticket-conformidad-canal.enum';

import { TicketConformidadEnlaceEntity } from '../../domain/entities/ticket-conformidad-enlace.entity';

import {
  TICKET_CONFORMIDAD_REPOSITORY,
  TicketConformidadRepositoryPort,
} from '../../domain/ports/ticket-conformidad.repository.port';

import {
  TICKET_CONFORMIDAD_ENLACE_REPOSITORY,
  TicketConformidadEnlaceRepositoryPort,
} from '../../domain/ports/ticket-conformidad-enlace.repository.port';
import {
  TICKET_CONFORMIDAD_TOKEN_PORT,
  TicketConformidadTokenPort,
} from '../port/ticket-conformidad-token.port';
import {
  TICKET_CONFORMIDAD_LINK_CONFIG_PORT,
  TicketConformidadLinkConfigPort,
} from '../port/ticket-conformidad-link-config.port';

export interface GenerarEnlaceTicketConformidadInput {
  conformidadId: number;

  canal: TicketConformidadCanal;

  telefonoDestino?: string | null;

  creadoPorId: number;
}

export interface GenerarEnlaceTicketConformidadOutput {
  enlaceId: number;

  conformidadId: number;

  /**
   * Única exposición del token plano.
   */
  token: string;

  canal: TicketConformidadCanal;

  telefonoDestino: string | null;

  expiraEn: Date;

  creadoEn: Date;
}

@Injectable()
export class GenerarEnlaceTicketConformidadUseCase {
  private static readonly MAX_TOKEN_GENERATION_ATTEMPTS = 3;

  constructor(
    @Inject(TICKET_CONFORMIDAD_REPOSITORY)
    private readonly conformidadRepository: TicketConformidadRepositoryPort,

    @Inject(TICKET_CONFORMIDAD_ENLACE_REPOSITORY)
    private readonly enlaceRepository: TicketConformidadEnlaceRepositoryPort,

    @Inject(TICKET_CONFORMIDAD_TOKEN_PORT)
    private readonly tokenPort: TicketConformidadTokenPort,

    @Inject(TICKET_CONFORMIDAD_LINK_CONFIG_PORT)
    private readonly linkConfigPort: TicketConformidadLinkConfigPort,
  ) {}

  async execute(
    input: GenerarEnlaceTicketConformidadInput,
  ): Promise<GenerarEnlaceTicketConformidadOutput> {
    const conformidad = await this.conformidadRepository.findById(
      input.conformidadId,
    );

    if (!conformidad) {
      throw new NotFoundException(
        `No existe la conformidad ${input.conformidadId}.`,
      );
    }

    if (!conformidad.estaPendiente()) {
      throw new ConflictException(
        'No se puede generar un enlace para una conformidad que ya fue respondida.',
      );
    }

    const ttlMinutes = this.linkConfigPort.getTtlMinutes();

    const now = new Date();

    const expiraEn = new Date(now.getTime() + ttlMinutes * 60_000);

    const generatedToken = await this.generateUniqueToken();

    const enlace = TicketConformidadEnlaceEntity.create({
      conformidadId: conformidad.id!,

      tokenHash: generatedToken.tokenHash,

      canal: input.canal,

      telefonoDestino: input.telefonoDestino ?? null,

      expiraEn,

      creadoPorId: input.creadoPorId,
    });

    const persisted = await this.enlaceRepository.create(enlace);

    if (persisted.id === null) {
      throw new Error(
        'El enlace de conformidad fue creado sin un identificador persistido.',
      );
    }

    return {
      enlaceId: persisted.id,

      conformidadId: persisted.conformidadId,

      token: generatedToken.token,

      canal: persisted.canal,

      telefonoDestino: persisted.telefonoDestino,

      expiraEn: persisted.expiraEn,

      creadoEn: persisted.creadoEn,
    };
  }

  private async generateUniqueToken(): Promise<{
    token: string;
    tokenHash: string;
  }> {
    for (
      let attempt = 0;
      attempt <
      GenerarEnlaceTicketConformidadUseCase.MAX_TOKEN_GENERATION_ATTEMPTS;
      attempt++
    ) {
      const generated = this.tokenPort.generate();

      const exists = await this.enlaceRepository.existsByTokenHash(
        generated.tokenHash,
      );

      if (!exists) {
        return generated;
      }
    }

    throw new Error(
      'No fue posible generar un token único para la conformidad.',
    );
  }
}
