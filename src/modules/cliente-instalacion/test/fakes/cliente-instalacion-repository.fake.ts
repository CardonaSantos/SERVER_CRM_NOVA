import { ClienteInstalacionEntity } from '../../domain/entities/cliente-instalacion.entity';
import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';
import { ClienteInstalacionTecnicoInvalidoError } from '../../domain/errors/cliente-instalacion.errors';
import {
  ActualizarTecnicoInstalacionInput,
  BuscarInstalacionAsignadaTecnicoParams,
  ClienteInstalacionRepositoryPort,
  CrearTecnicoInstalacionInput,
} from '../../domain/ports/cliente-instalacion-repository.port';

/** Repositorio en memoria: las instalaciones y qué técnicos tienen asignadas. */
export class ClienteInstalacionRepositoryFake
  implements ClienteInstalacionRepositoryPort
{
  readonly filas = new Map<number, ClienteInstalacionEntity>();
  readonly asignaciones = new Map<number, Set<number>>();
  readonly tecnicosCreados: CrearTecnicoInstalacionInput[][] = [];
  readonly tecnicosReemplazados: ActualizarTecnicoInstalacionInput[][] = [];
  /** Ids de técnicos que el repositorio real rechazaría (inexistentes o inactivos). */
  tecnicosInvalidos = new Set<number>();
  guardados = 0;
  private siguienteId = 100;

  /** Deja una instalación ya guardada (con id) en el estado pedido. */
  sembrar(
    estado: EstadoInstalacionCliente = EstadoInstalacionCliente.PROGRAMADA,
    extra: Record<string, unknown> = {},
  ): ClienteInstalacionEntity {
    const id = this.siguienteId++;
    const entidad = ClienteInstalacionEntity.hydrate({
      ...ClienteInstalacionEntity.create({
        empresaId: 1,
        clienteId: 7,
        creadoPorId: 3,
      }).toPrimitives(),
      id,
      estado,
      ...extra,
    });

    this.filas.set(id, entidad);

    return entidad;
  }

  asignar(instalacionId: number, tecnicoId: number): void {
    const conjunto = this.asignaciones.get(instalacionId) ?? new Set<number>();

    conjunto.add(tecnicoId);
    this.asignaciones.set(instalacionId, conjunto);
  }

  create(
    entity: ClienteInstalacionEntity,
    tecnicos: CrearTecnicoInstalacionInput[] = [],
  ): Promise<ClienteInstalacionEntity> {
    this.exigirTecnicosValidos(tecnicos);

    const creada = ClienteInstalacionEntity.hydrate({
      ...entity.toPrimitives(),
      id: this.siguienteId++,
    });

    this.filas.set(creada.id as number, creada);
    this.tecnicosCreados.push(tecnicos);
    tecnicos.forEach((t) => this.asignar(creada.id as number, t.tecnicoId));

    return Promise.resolve(creada);
  }

  findById(id: number): Promise<ClienteInstalacionEntity | null> {
    return Promise.resolve(this.filas.get(id) ?? null);
  }

  save(
    entity: ClienteInstalacionEntity,
    tecnicos?: ActualizarTecnicoInstalacionInput[],
  ): Promise<ClienteInstalacionEntity> {
    if (tecnicos) {
      this.exigirTecnicosValidos(tecnicos);
      this.tecnicosReemplazados.push(tecnicos);
      this.asignaciones.set(
        entity.id as number,
        new Set(tecnicos.map((t) => t.tecnicoId)),
      );
    }

    this.guardados++;
    this.filas.set(entity.id as number, entity);

    return Promise.resolve(entity);
  }

  findByIdAssignedToTechnician(
    params: BuscarInstalacionAsignadaTecnicoParams,
  ): Promise<ClienteInstalacionEntity | null> {
    const asignado = this.asignaciones
      .get(params.instalacionId)
      ?.has(params.tecnicoId);

    return Promise.resolve(
      asignado ? (this.filas.get(params.instalacionId) ?? null) : null,
    );
  }

  private exigirTecnicosValidos(tecnicos: { tecnicoId: number }[]): void {
    if (tecnicos.some((t) => this.tecnicosInvalidos.has(t.tecnicoId))) {
      throw new ClienteInstalacionTecnicoInvalidoError(
        'Uno o más técnicos no existen o están inactivos.',
      );
    }
  }
}
