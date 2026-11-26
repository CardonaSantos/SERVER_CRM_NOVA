import { TicketFirmaEntity } from '../../domain/entities/ticket-firma.entity';
import { TicketFirmaTipo } from '../../domain/enums/ticket-firma-tipo.enum';
import { TicketFirmaRepositoryPort } from '../../domain/ports/ticket-firma-repository.port';

export class TicketFirmaRepositoryFake implements TicketFirmaRepositoryPort {
  readonly filas: TicketFirmaEntity[] = [];

  /** Si se asigna, `create` falla con este error (p. ej. la BD rechaza la firma). */
  falla: Error | null = null;

  create(entity: TicketFirmaEntity): Promise<TicketFirmaEntity> {
    if (this.falla) return Promise.reject(this.falla);

    const creada = TicketFirmaEntity.hydrate({
      ...entity.toPrimitives(),
      id: this.filas.length + 1,
    });

    this.filas.push(creada);

    return Promise.resolve(creada);
  }

  existsByConformidadAndTipo(
    conformidadId: number,
    tipo: TicketFirmaTipo,
  ): Promise<boolean> {
    return Promise.resolve(
      this.filas.some(
        (f) => f.conformidadId === conformidadId && f.tipo === tipo,
      ),
    );
  }
}
