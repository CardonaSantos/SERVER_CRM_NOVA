import {
  ConflictException,
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  TICKET_CONFORMIDAD_ENLACE_REPOSITORY,
  TicketConformidadEnlaceRepositoryPort,
} from '../../domain/ports/ticket-conformidad-enlace.repository.port';
import {
  TICKET_CONFORMIDAD_REPOSITORY,
  TicketConformidadRepositoryPort,
} from '../../domain/ports/ticket-conformidad.repository.port';
import {
  TICKET_CONFORMIDAD_TOKEN_PORT,
  TicketConformidadTokenPort,
} from '../port/ticket-conformidad-token.port';
import {
  TICKET_CONFORMIDAD_PUBLIC_QUERY_PORT,
  TicketConformidadPublicQueryPort,
} from '../port/ticket-conformidad-public-query.port';
import { TicketConformidadPublicReadModel } from '../models/ticket-conformidad-public.read-model';

export interface ObtenerTicketConformidadPublicaInput {
  token: string;
}

@Injectable()
export class ObtenerTicketConformidadPublicaUseCase {
  constructor(
    @Inject(TICKET_CONFORMIDAD_TOKEN_PORT)
    private readonly tokenPort: TicketConformidadTokenPort,

    @Inject(TICKET_CONFORMIDAD_ENLACE_REPOSITORY)
    private readonly enlaceRepository: TicketConformidadEnlaceRepositoryPort,

    @Inject(TICKET_CONFORMIDAD_REPOSITORY)
    private readonly conformidadRepository: TicketConformidadRepositoryPort,

    @Inject(TICKET_CONFORMIDAD_PUBLIC_QUERY_PORT)
    private readonly publicQuery: TicketConformidadPublicQueryPort,
  ) {}

  async execute(
    input: ObtenerTicketConformidadPublicaInput,
  ): Promise<TicketConformidadPublicReadModel> {
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

    const result = await this.publicQuery.findByConformidadId(
      conformidad.id!,
      enlace.expiraEn,
    );

    if (!result) {
      throw new NotFoundException('La solicitud de conformidad no existe.');
    }

    return result;
  }
}
