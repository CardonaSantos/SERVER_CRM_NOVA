import { PerfilHomologacionEntity } from '../../domain/entities/perfil-homologacion.entity';
import {
  BuscarPerfilPorRouterCodigoParams,
  BuscarPerfilPorRouterServicioParams,
  PerfilHomologacionRepositoryPort,
} from '../../domain/ports/perfil-homologacion-repository.port';

/** Homologaciones en memoria para pruebas; asigna ids como la BD. */
export class PerfilHomologacionRepositoryFake
  implements PerfilHomologacionRepositoryPort
{
  private readonly filas = new Map<number, PerfilHomologacionEntity>();
  private siguienteId = 1;
  escrituras = 0;

  async create(
    entity: PerfilHomologacionEntity,
  ): Promise<PerfilHomologacionEntity> {
    this.escrituras++;
    const guardada = PerfilHomologacionEntity.hydrate({
      ...entity.toPrimitives(),
      id: this.siguienteId++,
    });
    this.filas.set(guardada.id!, guardada);
    return this.copia(guardada)!;
  }

  async update(
    entity: PerfilHomologacionEntity,
  ): Promise<PerfilHomologacionEntity> {
    this.escrituras++;
    const guardada = PerfilHomologacionEntity.hydrate(entity.toPrimitives());
    this.filas.set(guardada.id!, guardada);
    return this.copia(guardada)!;
  }

  async findById(id: number): Promise<PerfilHomologacionEntity | null> {
    return this.copia(this.filas.get(id));
  }

  async findByRouterAndService(
    p: BuscarPerfilPorRouterServicioParams,
  ): Promise<PerfilHomologacionEntity | null> {
    return this.copia(
      this.buscar(
        (f) =>
          f.mikrotikRouterId === p.mikrotikRouterId &&
          f.servicioInternetId === p.servicioInternetId,
      ),
    );
  }

  async findActiveByRouterAndService(
    p: BuscarPerfilPorRouterServicioParams,
  ): Promise<PerfilHomologacionEntity | null> {
    const fila = await this.findByRouterAndService(p);
    return fila?.activo ? fila : null;
  }

  async findByRouterAndCode(
    p: BuscarPerfilPorRouterCodigoParams,
  ): Promise<PerfilHomologacionEntity | null> {
    return this.copia(
      this.buscar(
        (f) =>
          f.mikrotikRouterId === p.mikrotikRouterId &&
          f.codigoPerfil === p.codigoPerfil,
      ),
    );
  }

  private buscar(
    cumple: (f: PerfilHomologacionEntity) => boolean,
  ): PerfilHomologacionEntity | undefined {
    return [...this.filas.values()].find(cumple);
  }

  private copia(
    fila: PerfilHomologacionEntity | undefined,
  ): PerfilHomologacionEntity | null {
    return fila ? PerfilHomologacionEntity.hydrate(fila.toPrimitives()) : null;
  }
}
