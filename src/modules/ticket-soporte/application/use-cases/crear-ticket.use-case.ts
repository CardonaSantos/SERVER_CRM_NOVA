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
import { TicketSoporteHistorialTipo } from 'src/modules/ticket-soporte-historial/public/ticket-soporte-historial.types';
import { TicketEntity } from '../../domain/entities/ticket.entity';
import { FaseTicket } from '../../domain/enums/fase-ticket.enum';
import { TicketAccionDeOficinaError } from '../../domain/errors/ticket-soporte.errors';
import {
  TICKET_REPOSITORY,
  TicketRepositoryPort,
} from '../../domain/ports/ticket-repository.port';
import { CrearTicketProps } from '../../domain/props/ticket.props';
import { TICKET_AVISOS, TicketAvisosPort } from '../ports/ticket-avisos.port';
import { ReferenciasTicketService } from '../services/referencias-ticket.service';
import {
  ActorTicket,
  ticketParaAviso,
} from '../services/transicion-ticket.service';

export type CrearTicketInput = ActorTicket &
  Omit<CrearTicketProps, 'creadoPorId' | 'empresaId'> & {
    empresaId: number;
    /** Todos los roles salvo el técnico asignan y fijan. */
    puedeAsignar: boolean;
    /** Número extra que también recibe el aviso por WhatsApp. */
    telefonoTemporal?: string | null;
  };

export type CrearTicketResult = { ticketId: number; estado: FaseTicket };

@Injectable()
export class CrearTicketUseCase {
  private readonly logger = new Logger(CrearTicketUseCase.name);

  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly tickets: TicketRepositoryPort,
    private readonly referencias: ReferenciasTicketService,
    @Inject(TICKET_SOPORTE_HISTORIAL)
    private readonly historial: TicketSoporteHistorialFacadePort,
    @Inject(TICKET_AVISOS) private readonly avisos: TicketAvisosPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: CrearTicketInput): Promise<CrearTicketResult> {
    const nuevo = TicketEntity.create(
      { ...input, creadoPorId: input.usuarioId },
      this.reloj.ahora(),
    );

    if (
      !input.puedeAsignar &&
      (nuevo.asignados.length || nuevo.toPrimitives().fijado)
    ) {
      throw new TicketAccionDeOficinaError(
        'Un técnico no puede asignar ni fijar tickets.',
      );
    }

    const { ticket, cliente } = await this.unidad.ejecutar(async () => {
      const cliente = await this.referencias.exigir({
        clienteId: nuevo.clienteId,
        usuarioIds: nuevo.asignados,
        etiquetaIds: nuevo.toPrimitives().etiquetaIds,
      });
      const ticket = await this.tickets.create(nuevo);

      await this.historial.registrarEvento({
        ticketId: ticket.id!,
        actor: input,
        tipo: TicketSoporteHistorialTipo.CREADO,
      });

      return { ticket, cliente };
    });

    this.logger.log(
      `Ticket ${ticket.id} creado por el usuario ${input.usuarioId}.`,
    );

    await this.avisos.asignacion({
      ticket: ticketParaAviso(ticket),
      agregados: ticket.asignados,
      retirados: [],
      motivo: 'CREATED',
    });

    // WhatsApp puede tardar: quien crea el ticket no espera.
    void this.avisos.clienteTicketCreado({
      ticketId: ticket.id!,
      titulo: ticket.titulo,
      nombreCliente: cliente?.nombre ?? null,
      telefonos: [
        cliente?.telefono ?? cliente?.telefonoReferencia,
        input.telefonoTemporal,
      ],
    });

    return { ticketId: ticket.id!, estado: ticket.fase };
  }
}
