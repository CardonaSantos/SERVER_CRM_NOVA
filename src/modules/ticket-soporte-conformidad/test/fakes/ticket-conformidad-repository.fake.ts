import { TicketConformidadEntity } from '../../domain/entities/ticket-conformidad.entity';
import { TicketConformidadResultado } from '../../domain/enums/ticket-conformidad-resultado.enum';
import { TicketConformidadRepositoryPort } from '../../domain/ports/ticket-conformidad-repository.port';
import { TicketConformidadProps } from '../../domain/props/ticket-conformidad.props';

const AHORA = new Date('2026-11-25T12:00:00.000Z');

export class TicketConformidadRepositoryFake
  implements TicketConformidadRepositoryPort
{
  readonly filas = new Map<number, TicketConformidadEntity>();
  private siguienteId = 1;

  /** Una conformidad ya guardada (PENDIENTE salvo que se indique otra cosa). */
  sembrar(
    cambios: Partial<TicketConformidadProps> = {},
  ): TicketConformidadEntity {
    const resultado = cambios.resultado ?? TicketConformidadResultado.PENDIENTE;
    const entidad = TicketConformidadEntity.hydrate({
      id: this.siguienteId++,
      ticketId: 10,
      clienteId: 5,
      tecnicoAsignadoId: 7,
      creadoPorId: 3,
      resultado,
      creadoEn: AHORA,
      actualizadoEn: AHORA,
      respondidoEn:
        resultado === TicketConformidadResultado.PENDIENTE ? null : AHORA,
      ...cambios,
    });

    this.filas.set(entidad.id as number, entidad);

    return entidad;
  }

  create(entity: TicketConformidadEntity): Promise<TicketConformidadEntity> {
    const creada = TicketConformidadEntity.hydrate({
      ...entity.toPrimitives(),
      id: this.siguienteId++,
    });

    this.filas.set(creada.id as number, creada);

    return Promise.resolve(creada);
  }

  findById(id: number): Promise<TicketConformidadEntity | null> {
    return Promise.resolve(this.filas.get(id) ?? null);
  }

  findPendingByTicketId(
    ticketId: number,
  ): Promise<TicketConformidadEntity | null> {
    const pendiente = [...this.filas.values()].find(
      (c) => c.ticketId === ticketId && c.estaPendiente(),
    );

    return Promise.resolve(pendiente ?? null);
  }
}
