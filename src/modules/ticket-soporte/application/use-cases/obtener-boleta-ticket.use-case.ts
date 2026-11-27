import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  TicketNoAsignadoError,
  TicketNoEncontradoError,
} from '../../domain/errors/ticket-soporte.errors';
import {
  TICKET_QUERY,
  TicketQueryPort,
} from '../../domain/ports/ticket-query.port';
import { TicketBoletaReadModel } from '../../domain/read-models/ticket-boleta.read-model';

export type ObtenerBoletaTicketInput = {
  ticketId: number;
  empresaId: number;
  soloAsignadosA?: number;
};

export type ObtenerBoletaTicketResult = TicketBoletaReadModel & {
  generadaEn: Date;
};

@Injectable()
export class ObtenerBoletaTicketUseCase {
  constructor(
    @Inject(TICKET_QUERY) private readonly consulta: TicketQueryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: ObtenerBoletaTicketInput,
  ): Promise<ObtenerBoletaTicketResult> {
    const boleta = await this.consulta.findBoleta(
      input.ticketId,
      input.empresaId,
    );
    if (!boleta) throw new TicketNoEncontradoError();

    if (
      input.soloAsignadosA !== undefined &&
      !boleta.asignados.includes(input.soloAsignadosA)
    ) {
      throw new TicketNoAsignadoError();
    }

    return { ...boleta, generadaEn: this.reloj.ahora() };
  }
}
