import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { AccionTicket } from '../../domain/enums/accion-ticket.enum';
import {
  TicketNoAsignadoError,
  TicketNoEncontradoError,
} from '../../domain/errors/ticket-soporte.errors';
import { accionesDisponibles } from '../../domain/policies/acciones-ticket.policy';
import { faseDe } from '../../domain/policies/fase-ticket.policy';
import { tiempoTecnico } from '../../domain/policies/tiempos-ticket.policy';
import {
  TICKET_QUERY,
  TicketQueryPort,
} from '../../domain/ports/ticket-query.port';
import { TicketDetalleReadModel } from '../../domain/read-models/ticket-detalle.read-model';

export type ObtenerTicketInput = {
  ticketId: number;
  usuarioId: number;
  gestiona: boolean;
  soloAsignadosA?: number;
};

export type ObtenerTicketResult = {
  ticket: TicketDetalleReadModel;
  /** Lo que este usuario puede hacer ahora. */
  acciones: AccionTicket[];
  puedeEditar: boolean;
  tiempoTrabajado: {
    /** `null`: no hay registro. */
    minutos: number | null;
    corriendoDesde: Date | null;
  };
};

@Injectable()
export class ObtenerTicketUseCase {
  constructor(
    @Inject(TICKET_QUERY) private readonly consulta: TicketQueryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: ObtenerTicketInput): Promise<ObtenerTicketResult> {
    const ticket = await this.consulta.findDetail(input.ticketId);
    if (!ticket) throw new TicketNoEncontradoError();

    const asignados = [
      ...(ticket.tecnico ? [ticket.tecnico.id] : []),
      ...ticket.apoyos.map((apoyo) => apoyo.id),
    ];

    if (
      input.soloAsignadosA !== undefined &&
      !asignados.includes(input.soloAsignadosA)
    ) {
      throw new TicketNoAsignadoError();
    }

    return {
      ticket,
      acciones: accionesDisponibles(faseDe(ticket.estado), {
        gestiona: input.gestiona,
        asignado: asignados.includes(input.usuarioId),
        tieneAsignados: asignados.length > 0,
      }),
      puedeEditar: input.gestiona,
      tiempoTrabajado: {
        minutos: tiempoTecnico(ticket.ciclos, this.reloj.ahora()),
        corriendoDesde:
          ticket.ciclos.find((ciclo) => ciclo.fin === null)?.inicio ?? null,
      },
    };
  }
}
