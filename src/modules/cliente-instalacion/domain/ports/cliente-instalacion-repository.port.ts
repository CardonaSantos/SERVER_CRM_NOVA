import { ClienteInstalacionEntity } from '../entities/cliente-instalacion.entity';
import { RolTecnicoOperacionCliente } from '../enums/rol-tecnico-operacion-cliente.enum';

export const CLIENTE_INSTALACION_REPOSITORY = Symbol(
  'CLIENTE_INSTALACION_REPOSITORY',
);

export type CrearTecnicoInstalacionInput = {
  tecnicoId: number;
  rol: RolTecnicoOperacionCliente;
  esResponsable: boolean;
  observaciones?: string | null;
};

export type ActualizarTecnicoInstalacionInput = CrearTecnicoInstalacionInput & {
  tiempoMinutos?: number | null;
};

export type BuscarInstalacionAsignadaTecnicoParams = {
  instalacionId: number;

  /** Sale del actor autenticado. */
  tecnicoId: number;
};

export interface ClienteInstalacionRepositoryPort {
  /**
   * Persiste la instalación y sus técnicos juntos. Lanza
   * `ClienteInstalacionTecnicoInvalidoError` si algún técnico no existe o
   * está inactivo.
   */
  create(
    entity: ClienteInstalacionEntity,
    tecnicos?: CrearTecnicoInstalacionInput[],
  ): Promise<ClienteInstalacionEntity>;

  findById(id: number): Promise<ClienteInstalacionEntity | null>;

  /**
   * Guarda los cambios hechos con los métodos de la entidad. Con `tecnicos`
   * reemplaza el conjunto de asignaciones de forma atómica; sin él no las
   * toca.
   */
  save(
    entity: ClienteInstalacionEntity,
    tecnicos?: ActualizarTecnicoInstalacionInput[],
  ): Promise<ClienteInstalacionEntity>;

  /** La instalación solo si el técnico figura asignado a ella. */
  findByIdAssignedToTechnician(
    params: BuscarInstalacionAsignadaTecnicoParams,
  ): Promise<ClienteInstalacionEntity | null>;
}
