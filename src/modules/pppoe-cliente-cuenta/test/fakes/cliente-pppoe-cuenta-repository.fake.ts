import { ClientePppoeCuentaEntity } from '../../domain/entities/cliente-pppoe-cuenta.entity';
import { EstadoCuentaPppoe } from '../../domain/enums/estado-cuenta-pppoe.enum';
import { ClientePppoeCuentaRepositoryPort } from '../../domain/ports/cliente-pppoe-cuenta-repository.port';
import { ClientePppoeCuentaProtegidaInstalacion } from '../../domain/read-models/cliente-pppoe-cuenta-protegida-instalacion.read-model';

/** Cuentas en memoria para pruebas; asigna ids como la BD. */
export class ClientePppoeCuentaRepositoryFake
  implements ClientePppoeCuentaRepositoryPort
{
  private readonly filas = new Map<number, ClientePppoeCuentaEntity>();
  private siguienteId = 1;

  async create(
    entity: ClientePppoeCuentaEntity,
  ): Promise<ClientePppoeCuentaEntity> {
    const guardada = ClientePppoeCuentaEntity.hydrate({
      ...entity.toPrimitives(),
      id: this.siguienteId++,
    });
    this.filas.set(guardada.id!, guardada);
    return this.copia(guardada)!;
  }

  async update(
    entity: ClientePppoeCuentaEntity,
  ): Promise<ClientePppoeCuentaEntity> {
    const guardada = ClientePppoeCuentaEntity.hydrate(entity.toPrimitives());
    this.filas.set(guardada.id!, guardada);
    return this.copia(guardada)!;
  }

  async findById(id: number): Promise<ClientePppoeCuentaEntity | null> {
    return this.copia(this.filas.get(id));
  }

  async findByAccesoInternetId(
    accesoInternetId: number,
  ): Promise<ClientePppoeCuentaEntity | null> {
    return this.copia(
      [...this.filas.values()].find(
        (c) => c.accesoInternetId === accesoInternetId,
      ),
    );
  }

  async findVigenteByUsuario(
    usuario: string,
  ): Promise<ClientePppoeCuentaEntity | null> {
    return this.copia(
      [...this.filas.values()].find(
        (c) =>
          c.usuario === usuario &&
          c.estado !== EstadoCuentaPppoe.ELIMINADA &&
          c.estado !== EstadoCuentaPppoe.CANCELADA,
      ),
    );
  }

  async findProtectedByInstalacionId(): Promise<
    ClientePppoeCuentaProtegidaInstalacion[]
  > {
    return [];
  }

  private copia(
    fila: ClientePppoeCuentaEntity | undefined,
  ): ClientePppoeCuentaEntity | null {
    return fila ? ClientePppoeCuentaEntity.hydrate(fila.toPrimitives()) : null;
  }
}
