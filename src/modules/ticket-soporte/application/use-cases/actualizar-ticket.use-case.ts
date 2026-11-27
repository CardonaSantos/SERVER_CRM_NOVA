import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import {
  TICKET_SOPORTE_HISTORIAL,
  TicketSoporteHistorialFacadePort,
} from 'src/modules/ticket-soporte-historial/public/ticket-soporte-historial.facade.port';
import {
  TicketAccionDeOficinaError,
  TicketNoEncontradoError,
} from '../../domain/errors/ticket-soporte.errors';
import {
  cambiaDatosDeOficina,
  cambiosDelTicket,
} from '../../domain/policies/cambios-ticket.policy';
import {
  TICKET_REFERENCIA_QUERY,
  TicketReferenciaQueryPort,
} from '../../domain/ports/ticket-referencia-query.port';
import {
  TICKET_REPOSITORY,
  TicketRepositoryPort,
} from '../../domain/ports/ticket-repository.port';
import { CambiosTicket, TicketProps } from '../../domain/props/ticket.props';
import { TICKET_AVISOS, TicketAvisosPort } from '../ports/ticket-avisos.port';
import { ReferenciasTicketService } from '../services/referencias-ticket.service';
import { ticketParaAviso } from '../services/transicion-ticket.service';

export type ActualizarTicketInput = {
  ticketId: number;
  usuarioId: number;
  usuarioNombre: string;
  /** Personal de oficina: edita todos los datos del ticket. */
  gestiona: boolean;
  cambios: CambiosTicket;
};

function asignadosDe(ticket: TicketProps): number[] {
  return ticket.tecnicoId === null
    ? ticket.apoyoIds
    : [ticket.tecnicoId, ...ticket.apoyoIds];
}

const sin = (ids: number[], otros: number[]) =>
  ids.filter((id) => !otros.includes(id));

/**
 * La oficina edita todo; los demás roles autorizados solo asignan y fijan. El
 * estado no se cambia aquí: tiene sus acciones.
 */
@Injectable()
export class ActualizarTicketUseCase {
  private readonly logger = new Logger(ActualizarTicketUseCase.name);

  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly tickets: TicketRepositoryPort,
    @Inject(TICKET_REFERENCIA_QUERY)
    private readonly consultas: TicketReferenciaQueryPort,
    private readonly referencias: ReferenciasTicketService,
    @Inject(TICKET_SOPORTE_HISTORIAL)
    private readonly historial: TicketSoporteHistorialFacadePort,
    @Inject(TICKET_AVISOS) private readonly avisos: TicketAvisosPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: ActualizarTicketInput): Promise<{ ticketId: number }> {
    const { ticket, agregados, retirados } = await this.unidad.ejecutar(
      async () => {
        const ticket = await this.tickets.bloquear(input.ticketId);
        if (!ticket) throw new TicketNoEncontradoError();

        const antes = ticket.toPrimitives();
        ticket.editar(input.cambios, this.reloj.ahora());
        const despues = ticket.toPrimitives();

        // Se compara lo que cambia, no lo que llega: un formulario puede
        // reenviar los datos sin tocarlos.
        if (!input.gestiona && cambiaDatosDeOficina(antes, despues)) {
          throw new TicketAccionDeOficinaError(
            'Solo la oficina puede cambiar los datos del ticket. Puedes asignar técnicos y fijarlo.',
          );
        }

        const agregados = sin(asignadosDe(despues), asignadosDe(antes));
        await this.referencias.exigir({
          clienteId:
            despues.clienteId === antes.clienteId ? null : despues.clienteId,
          usuarioIds: agregados,
          etiquetaIds: sin(despues.etiquetaIds, antes.etiquetaIds),
        });

        await this.tickets.update(ticket);
        await this.historial.registrarActualizacion({
          ticketId: input.ticketId,
          actor: input,
          cambios: cambiosDelTicket(
            antes,
            despues,
            await this.nombres(antes, despues),
          ),
        });

        return {
          ticket,
          agregados,
          retirados: sin(asignadosDe(antes), asignadosDe(despues)),
        };
      },
    );

    this.logger.log(
      `Ticket ${input.ticketId} editado por el usuario ${input.usuarioId}.`,
    );

    if (agregados.length || retirados.length) {
      await this.avisos.asignacion({
        ticket: ticketParaAviso(ticket),
        agregados,
        retirados,
        motivo: 'REASSIGNED',
      });
    }

    return { ticketId: input.ticketId };
  }

  private async nombres(antes: TicketProps, despues: TicketProps) {
    const unir = (ids: Array<number | null>) => [
      ...new Set(ids.filter((id): id is number => id !== null)),
    ];

    const [usuarios, etiquetas, clientes] = await Promise.all([
      this.consultas.nombresUsuarios(
        unir([...asignadosDe(antes), ...asignadosDe(despues)]),
      ),
      this.consultas.nombresEtiquetas(
        unir([...antes.etiquetaIds, ...despues.etiquetaIds]),
      ),
      this.consultas.nombresClientes(
        unir([antes.clienteId, despues.clienteId]),
      ),
    ]);

    return { usuarios, etiquetas, clientes };
  }
}
