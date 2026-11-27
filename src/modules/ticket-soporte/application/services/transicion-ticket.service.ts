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
  TicketHistorialCambio,
  TicketSoporteHistorialTipo,
} from 'src/modules/ticket-soporte-historial/public/ticket-soporte-historial.types';
import { TicketEntity } from '../../domain/entities/ticket.entity';
import { AccionTicket } from '../../domain/enums/accion-ticket.enum';
import { FaseTicket } from '../../domain/enums/fase-ticket.enum';
import { TicketNoEncontradoError } from '../../domain/errors/ticket-soporte.errors';
import { exigirAccion } from '../../domain/policies/acciones-ticket.policy';
import { NOMBRE_FASE } from '../../domain/policies/fase-ticket.policy';
import {
  CicloTrabajo,
  duracionCiclo,
} from '../../domain/policies/tiempos-ticket.policy';
import {
  TICKET_REFERENCIA_QUERY,
  TicketReferenciaQueryPort,
} from '../../domain/ports/ticket-referencia-query.port';
import {
  TICKET_REPOSITORY,
  TicketRepositoryPort,
} from '../../domain/ports/ticket-repository.port';
import {
  TICKET_AVISOS,
  TicketAvisosPort,
  TicketParaAviso,
} from '../ports/ticket-avisos.port';

export type ActorTicket = {
  usuarioId: number;
  usuarioNombre: string;
  /** Personal de oficina: puede cambiar cualquier ticket. */
  gestiona: boolean;
};

export type TransicionResult = {
  ticketId: number;
  estado: FaseTicket;
};

export type ContextoTransicion = {
  ahora: Date;
  /** Ciclos de trabajo ya cerrados hasta `ahora` (salvo al iniciar). */
  ciclos: CicloTrabajo[];
  /** Estaba en proceso o tenía el reloj corriendo. */
  huboTrabajo: boolean;
};

export type EventoTransicion = {
  descripcion: string;
  tipo?: TicketSoporteHistorialTipo;
  cambios?: TicketHistorialCambio[];
};

const YA_APLICADA: Partial<Record<AccionTicket, FaseTicket>> = {
  [AccionTicket.INICIAR]: FaseTicket.EN_PROCESO,
  [AccionTicket.ENVIAR_REVISION]: FaseTicket.EN_REVISION,
};

export function ticketParaAviso(ticket: TicketEntity): TicketParaAviso {
  return {
    id: ticket.id!,
    empresaId: ticket.empresaId,
    titulo: ticket.titulo,
    estado: ticket.estado,
    prioridad: ticket.prioridad,
  };
}

/** Todo cambio de estado: bloqueo, reglas, reloj, bitácora y aviso. */
@Injectable()
export class TransicionTicketService {
  private readonly logger = new Logger(TransicionTicketService.name);

  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly tickets: TicketRepositoryPort,
    @Inject(TICKET_REFERENCIA_QUERY)
    private readonly referencias: TicketReferenciaQueryPort,
    @Inject(TICKET_SOPORTE_HISTORIAL)
    private readonly historial: TicketSoporteHistorialFacadePort,
    @Inject(TICKET_AVISOS) private readonly avisos: TicketAvisosPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async ejecutar(
    accion: AccionTicket,
    ticketId: number,
    actor: ActorTicket,
    aplicar: (
      ticket: TicketEntity,
      contexto: ContextoTransicion,
    ) => Promise<EventoTransicion>,
  ): Promise<TransicionResult> {
    const { ticket, cambiado } = await this.unidad.ejecutar(async () => {
      const ticket = await this.tickets.bloquear(ticketId);
      if (!ticket) throw new TicketNoEncontradoError();

      const quien = {
        gestiona: actor.gestiona,
        asignado: ticket.estaAsignado(actor.usuarioId),
      };

      // Repetir "iniciar" o "enviar a revisión" (doble toque) no es un error.
      if (
        ticket.fase === YA_APLICADA[accion] &&
        (quien.gestiona || quien.asignado)
      ) {
        return { ticket, cambiado: false };
      }

      exigirAccion(accion, ticket.fase, quien);

      const faseAnterior = ticket.fase;
      const ahora = this.reloj.ahora();
      const contexto = await this.contexto(accion, ticket, ahora);
      const evento = await aplicar(ticket, contexto);

      if (accion === AccionTicket.INICIAR) {
        await this.abrirReloj(ticket, actor.usuarioId, contexto);
      }

      await this.tickets.update(ticket);
      await this.historial.registrarEvento({
        ticketId,
        actor,
        tipo: evento.tipo ?? TicketSoporteHistorialTipo.ESTADO_CAMBIADO,
        descripcion: evento.descripcion,
        cambios: [
          {
            campo: 'estado',
            anterior: NOMBRE_FASE[faseAnterior],
            nuevo: NOMBRE_FASE[ticket.fase],
          },
          ...(evento.cambios ?? []),
        ],
      });

      return { ticket, cambiado: true };
    });

    if (cambiado) {
      this.logger.log(
        `Ticket ${ticketId}: ${accion} por el usuario ${actor.usuarioId}.`,
      );
      await this.avisar(ticket);
    }

    return { ticketId, estado: ticket.fase };
  }

  /** Salir de "en proceso" detiene todos los relojes abiertos. */
  private async contexto(
    accion: AccionTicket,
    ticket: TicketEntity,
    ahora: Date,
  ): Promise<ContextoTransicion> {
    const ciclos = await this.tickets.ciclos(ticket.id!);
    const abiertos = ciclos.filter((ciclo) => ciclo.fin === null);
    const huboTrabajo =
      ticket.fase === FaseTicket.EN_PROCESO || abiertos.length > 0;

    if (accion !== AccionTicket.INICIAR) {
      for (const ciclo of abiertos) {
        ciclo.fin = ahora;
        ciclo.duracionMinutos = duracionCiclo(ciclo.inicio, ahora);
        await this.tickets.cerrarCiclo(ciclo.id, ahora, ciclo.duracionMinutos);
      }
    }

    return { ahora, ciclos, huboTrabajo };
  }

  private async abrirReloj(
    ticket: TicketEntity,
    usuarioId: number,
    contexto: ContextoTransicion,
  ): Promise<void> {
    if (contexto.ciclos.some((ciclo) => ciclo.fin === null)) return;

    const tecnicoId = ticket.estaAsignado(usuarioId)
      ? usuarioId
      : ticket.asignados[0];

    await this.tickets.abrirCiclo(ticket.id!, tecnicoId, contexto.ahora);
  }

  private async avisar(ticket: TicketEntity): Promise<void> {
    const tecnicoId = ticket.tecnicoId;
    const nombres = tecnicoId
      ? await this.referencias.nombresUsuarios([tecnicoId])
      : null;

    await this.avisos.cambioEstado(
      ticketParaAviso(ticket),
      (tecnicoId && nombres?.get(tecnicoId)) || null,
    );
  }
}
