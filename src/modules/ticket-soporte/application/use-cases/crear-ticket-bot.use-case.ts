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
import {
  LARGO_MAXIMO_DESCRIPCION,
  TicketEntity,
} from '../../domain/entities/ticket.entity';
import { PrioridadTicket } from '../../domain/enums/prioridad-ticket.enum';
import {
  TICKET_REPOSITORY,
  TicketRepositoryPort,
} from '../../domain/ports/ticket-repository.port';
import { TicketProps } from '../../domain/props/ticket.props';
import { TICKET_AVISOS, TicketAvisosPort } from '../ports/ticket-avisos.port';

const FIRMA_BOT = '     ~ Creado por Botsito';

export type CrearTicketBotInput = { titulo: string; descripcion: string };

/** Ticket que llega del bot externo: urgente, fijado y sin cliente. */
@Injectable()
export class CrearTicketBotUseCase {
  private readonly logger = new Logger(CrearTicketBotUseCase.name);

  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly tickets: TicketRepositoryPort,
    @Inject(TICKET_SOPORTE_HISTORIAL)
    private readonly historial: TicketSoporteHistorialFacadePort,
    @Inject(TICKET_AVISOS) private readonly avisos: TicketAvisosPort,
    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: CrearTicketBotInput): Promise<TicketProps> {
    const descripcion = input.descripcion.slice(
      0,
      LARGO_MAXIMO_DESCRIPCION - FIRMA_BOT.length,
    );
    const nuevo = TicketEntity.create(
      {
        empresaId: null,
        titulo: input.titulo,
        descripcion: `${descripcion}${FIRMA_BOT}`,
        prioridad: PrioridadTicket.URGENTE,
        fijado: true,
      },
      this.reloj.ahora(),
    );

    const ticket = await this.unidad.ejecutar(async () => {
      const creado = await this.tickets.create(nuevo);

      await this.historial.registrarEvento({
        ticketId: creado.id!,
        actor: null,
        tipo: TicketSoporteHistorialTipo.CREADO,
        descripcion: 'Ticket creado por el bot',
      });

      return creado;
    });

    this.logger.log(`Ticket ${ticket.id} creado por el bot.`);
    const datos = ticket.toPrimitives();

    await this.avisos.ticketDelBot({
      id: ticket.id!,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
    });

    return datos;
  }
}
