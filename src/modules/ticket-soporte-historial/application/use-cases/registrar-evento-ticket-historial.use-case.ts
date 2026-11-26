import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { TicketSoporteHistorialEntity } from '../../domain/entities/ticket-soporte-historial.entity';
import {
  TICKET_SOPORTE_HISTORIAL_REPOSITORY,
  TicketSoporteHistorialRepositoryPort,
} from '../../domain/ports/ticket-soporte-historial-repository.port';
import {
  construirDescripcionHistorial,
  descripcionPorDefecto,
} from '../../domain/policies/descripcion-historial.policy';
import { RegistrarEventoTicketHistorialInput } from '../../public/ticket-soporte-historial.facade.port';

export const USUARIO_SISTEMA = 'Sistema';

@Injectable()
export class RegistrarEventoTicketHistorialUseCase {
  constructor(
    @Inject(TICKET_SOPORTE_HISTORIAL_REPOSITORY)
    private readonly historial: TicketSoporteHistorialRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  /** Devuelve el id de la entrada creada. */
  async execute(input: RegistrarEventoTicketHistorialInput): Promise<number> {
    const entrada = TicketSoporteHistorialEntity.create(
      {
        ticketId: input.ticketId,
        usuarioId: input.actor?.usuarioId ?? null,
        usuarioNombre: input.actor?.usuarioNombre ?? USUARIO_SISTEMA,
        tipo: input.tipo,
        descripcion: construirDescripcionHistorial(
          input.descripcion ?? descripcionPorDefecto(input.tipo),
          input.cambios ?? [],
        ),
      },
      this.reloj.ahora(),
    );

    const guardada = await this.historial.create(entrada);

    return guardada.id as number;
  }
}
