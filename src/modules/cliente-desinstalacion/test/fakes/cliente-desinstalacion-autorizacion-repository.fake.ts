import { ClienteDesinstalacionAutorizacionEntity } from '../../domain/entities/cliente-desinstalacion-autorizacion.entity';
import { ClienteDesinstalacionAutorizacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion-autorizacion-repository.port';

const AHORA = new Date('2026-11-25T12:00:00.000Z');

export class ClienteDesinstalacionAutorizacionRepositoryFake
  implements ClienteDesinstalacionAutorizacionRepositoryPort
{
  readonly filas = new Map<number, ClienteDesinstalacionAutorizacionEntity>();
  guardados = 0;
  private siguienteId = 1;

  /** Una autorización PENDIENTE ya guardada. */
  sembrar(desinstalacionId: number): ClienteDesinstalacionAutorizacionEntity {
    const entidad = ClienteDesinstalacionAutorizacionEntity.hydrate({
      ...ClienteDesinstalacionAutorizacionEntity.create(
        { desinstalacionId, solicitadoPorId: 3 },
        AHORA,
      ).toPrimitives(),
      id: this.siguienteId++,
    });

    this.filas.set(entidad.id as number, entidad);

    return entidad;
  }

  create(
    entity: ClienteDesinstalacionAutorizacionEntity,
  ): Promise<ClienteDesinstalacionAutorizacionEntity> {
    const creada = ClienteDesinstalacionAutorizacionEntity.hydrate({
      ...entity.toPrimitives(),
      id: this.siguienteId++,
    });

    this.filas.set(creada.id as number, creada);

    return Promise.resolve(creada);
  }

  findById(
    id: number,
  ): Promise<ClienteDesinstalacionAutorizacionEntity | null> {
    return Promise.resolve(this.filas.get(id) ?? null);
  }

  findUltimaByDesinstalacionId(
    desinstalacionId: number,
  ): Promise<ClienteDesinstalacionAutorizacionEntity | null> {
    const delaDesinstalacion = [...this.filas.values()].filter(
      (a) => a.desinstalacionId === desinstalacionId,
    );

    return Promise.resolve(
      delaDesinstalacion[delaDesinstalacion.length - 1] ?? null,
    );
  }

  save(
    entity: ClienteDesinstalacionAutorizacionEntity,
  ): Promise<ClienteDesinstalacionAutorizacionEntity> {
    this.guardados++;
    this.filas.set(entity.id as number, entity);

    return Promise.resolve(entity);
  }
}
