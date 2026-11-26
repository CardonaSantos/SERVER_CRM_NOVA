import { ClienteEntity } from '../entities/cliente.entity';
import { CambioCliente } from '../props/cliente.props';
import { Coordenadas } from '../policies/coordenadas.policy';
import { IpClienteReadModel } from '../read-models/ip-cliente.read-model';

export const CLIENTE_REPOSITORY = Symbol('CLIENTE_REPOSITORY');

/** `undefined` no se escribe; en un alta toma el valor por defecto. */
export type GuardarIpCliente = {
  direccionIp?: string;
  gateway?: string;
  mascara?: string;
};

export interface ClienteRepositoryPort {
  /** Incluye los eliminados: cada caso de uso decide qué hacer con ellos. */
  findById(id: number): Promise<ClienteEntity | null>;

  /** @throws ClienteReferenciaInvalidaError si una asignación no existe. */
  create(entity: ClienteEntity): Promise<ClienteEntity>;

  /**
   * Guarda solo los campos que cambiaron. Si cambió el estado operativo, exige
   * que siga siendo el que se leyó.
   * @throws ClienteModificadoError si otro proceso lo cambió antes.
   */
  update(entity: ClienteEntity): Promise<ClienteEntity>;

  /** Crea o actualiza la IP del cliente (una por cliente). */
  guardarIp(
    clienteId: number,
    ip: GuardarIpCliente,
  ): Promise<IpClienteReadModel>;

  /** Crea o actualiza la ubicación del cliente (una por cliente). */
  guardarUbicacion(
    clienteId: number,
    empresaId: number,
    coordenadas: Coordenadas,
  ): Promise<void>;

  /** Deja exactamente estos servicios adicionales contratados. */
  reemplazarServicios(
    clienteId: number,
    servicioIds: number[],
    fechaInicio: Date | null,
  ): Promise<void>;

  /** Anota un renglón en el historial del cliente. */
  registrarCambio(cambio: CambioCliente): Promise<void>;
}
