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
  inferirTipoActualizacion,
  soloCambiosReales,
} from '../../domain/policies/descripcion-historial.policy';
import { RegistrarActualizacionTicketInput } from '../../public/ticket-soporte-historial.facade.port';
import { USUARIO_SISTEMA } from './registrar-evento-ticket-historial.use-case';

@Injectable()
export class RegistrarActualizacionTicketUseCase {
  constructor(
    @Inject(TICKET_SOPORTE_HISTORIAL_REPOSITORY)
    private readonly historial: TicketSoporteHistorialRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  /** Devuelve el id de la entrada creada o `null` si no hubo cambios reales. */
  async execute(
    input: RegistrarActualizacionTicketInput,
  ): Promise<number | null> {
    const cambios = soloCambiosReales(input.cambios);

    if (cambios.length === 0) return null;

    const tipo = inferirTipoActualizacion(cambios);

    const entrada = TicketSoporteHistorialEntity.create(
      {
        ticketId: input.ticketId,
        usuarioId: input.actor?.usuarioId ?? null,
        usuarioNombre: input.actor?.usuarioNombre ?? USUARIO_SISTEMA,
        tipo,
        descripcion: construirDescripcionHistorial(
          input.descripcion ?? descripcionPorDefecto(tipo),
          cambios,
        ),
      },
      this.reloj.ahora(),
    );

    const guardada = await this.historial.create(entrada);

    return guardada.id as number;
  }
}
