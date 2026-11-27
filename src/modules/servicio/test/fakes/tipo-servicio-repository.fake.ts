import { TipoServicioEntity } from '../../domain/entities/tipo-servicio.entity';
import { TipoServicioNombreDuplicadoError } from '../../domain/errors/servicio.errors';
import { TipoServicioRepositoryPort } from '../../domain/ports/tipo-servicio-repository.port';
import { TipoServicioProps } from '../../domain/props/tipo-servicio.props';

export class TipoServicioRepositoryFake implements TipoServicioRepositoryPort {
  readonly filas = new Map<number, TipoServicioProps>();
  private siguienteId = 1;

  findById(id: number): Promise<TipoServicioEntity | null> {
    const fila = this.filas.get(id);

    return Promise.resolve(
      fila ? TipoServicioEntity.hydrate({ ...fila }) : null,
    );
  }

  findAll(): Promise<TipoServicioEntity[]> {
    return Promise.resolve(
      [...this.filas.values()]
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .map((fila) => TipoServicioEntity.hydrate({ ...fila })),
    );
  }

  create(entity: TipoServicioEntity): Promise<TipoServicioEntity> {
    if ([...this.filas.values()].some((f) => f.nombre === entity.nombre)) {
      return Promise.reject(new TipoServicioNombreDuplicadoError());
    }
    const id = this.siguienteId++;
    this.filas.set(id, { ...entity.toPrimitives(), id });

    return this.findById(id).then((tipo) => tipo!);
  }
}
