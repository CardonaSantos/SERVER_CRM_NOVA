import { ClienteAccesoInternetEntity } from '../../domain/entities/cliente-acceso-internet.entity';
import {
  EstadoAccesoInternet,
  MetodoAutenticacionInternet,
} from '../../domain/enums/cliente-acceso-internet.enum';
import {
  BuscarAccesoInternetDelClienteParams,
  ClienteAccesoInternetRepositoryPort,
} from '../../domain/ports/cliente-acceso-internet-repository.port';

/** Accesos en memoria para pruebas; asigna ids como la BD. */
export class ClienteAccesoInternetRepositoryFake
  implements ClienteAccesoInternetRepositoryPort
{
  private readonly filas = new Map<number, ClienteAccesoInternetEntity>();
  private siguienteId = 1;

  async create(
    entity: ClienteAccesoInternetEntity,
  ): Promise<ClienteAccesoInternetEntity> {
    const guardada = ClienteAccesoInternetEntity.hydrate({
      ...entity.toPrimitives(),
      id: this.siguienteId++,
    });
    this.filas.set(guardada.id!, guardada);
    return guardada;
  }

  async update(
    entity: ClienteAccesoInternetEntity,
  ): Promise<ClienteAccesoInternetEntity> {
    const guardada = ClienteAccesoInternetEntity.hydrate(entity.toPrimitives());
    this.filas.set(guardada.id!, guardada);
    return guardada;
  }

  async findById(id: number): Promise<ClienteAccesoInternetEntity | null> {
    return this.copia(this.filas.get(id));
  }

  async findByIdForClient(
    params: BuscarAccesoInternetDelClienteParams,
  ): Promise<ClienteAccesoInternetEntity | null> {
    const fila = this.filas.get(params.accesoInternetId);
    return fila?.clienteId === params.clienteId ? this.copia(fila) : null;
  }

  async findPppoeVigenteByClienteId(
    clienteId: number,
  ): Promise<ClienteAccesoInternetEntity | null> {
    const vigentes = [...this.filas.values()]
      .filter(
        (a) =>
          a.clienteId === clienteId &&
          a.metodoAutenticacion === MetodoAutenticacionInternet.PPPOE &&
          a.estado !== EstadoAccesoInternet.BAJA,
      )
      .sort((a, b) => b.id! - a.id!);
    return this.copia(vigentes[0]);
  }

  private copia(
    fila: ClienteAccesoInternetEntity | undefined,
  ): ClienteAccesoInternetEntity | null {
    return fila
      ? ClienteAccesoInternetEntity.hydrate(fila.toPrimitives())
      : null;
  }
}
