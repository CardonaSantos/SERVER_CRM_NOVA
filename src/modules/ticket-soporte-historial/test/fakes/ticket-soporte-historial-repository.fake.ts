import { TicketSoporteHistorialEntity } from '../../domain/entities/ticket-soporte-historial.entity';
import { TicketSoporteHistorialRepositoryPort } from '../../domain/ports/ticket-soporte-historial-repository.port';

export class TicketSoporteHistorialRepositoryFake
  implements TicketSoporteHistorialRepositoryPort
{
  readonly filas: TicketSoporteHistorialEntity[] = [];

  create(
    entity: TicketSoporteHistorialEntity,
  ): Promise<TicketSoporteHistorialEntity> {
    const creada = TicketSoporteHistorialEntity.hydrate({
      ...entity.toPrimitives(),
      id: this.filas.length + 1,
    });

    this.filas.push(creada);

    return Promise.resolve(creada);
  }
}
