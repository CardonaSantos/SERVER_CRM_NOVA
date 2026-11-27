import { PlanInternetEntity } from '../../domain/entities/plan-internet.entity';
import { EstadoServicio } from '../../domain/enums/estado-servicio.enum';
import { PlanInternetModificadoError } from '../../domain/errors/servicio.errors';
import { mismoNombre } from '../../domain/policies/catalogo.policy';
import {
  ClientesDelPlan,
  PlanInternetRepositoryPort,
  UsoPlanInternet,
} from '../../domain/ports/plan-internet-repository.port';
import { PlanInternetProps } from '../../domain/props/plan-internet.props';

export const SIN_USO: UsoPlanInternet = {
  clientes: 0,
  accesos: 0,
  instalaciones: 0,
  desinstalaciones: 0,
  homologaciones: 0,
};

export class PlanInternetRepositoryFake implements PlanInternetRepositoryPort {
  readonly filas = new Map<number, PlanInternetProps>();
  readonly usos = new Map<number, UsoPlanInternet>();
  readonly clientes = new Map<number, ClientesDelPlan>();
  /** Pares `plan:cliente` que el cliente ya tiene. */
  readonly asignados = new Set<string>();
  /** Bloqueos y escrituras, en orden. */
  readonly pasos: string[] = [];
  private siguienteId = 1;

  sembrar(cambios: Partial<PlanInternetProps> = {}): number {
    const id = cambios.id ?? this.siguienteId++;
    this.filas.set(id, {
      empresaId: 1,
      nombre: `Plan ${id}`,
      velocidad: '20 Mbps',
      precio: 150,
      estado: EstadoServicio.ACTIVO,
      creadoEn: new Date('2026-01-01T00:00:00Z'),
      actualizadoEn: new Date('2026-01-01T00:00:00Z'),
      eliminadoEn: null,
      eliminadoPorId: null,
      ...cambios,
      id,
    });
    return id;
  }

  findById(id: number): Promise<PlanInternetEntity | null> {
    const fila = this.filas.get(id);

    return Promise.resolve(
      fila ? PlanInternetEntity.hydrate({ ...fila }) : null,
    );
  }

  create(entity: PlanInternetEntity): Promise<PlanInternetEntity> {
    const id = this.siguienteId++;
    this.filas.set(id, { ...entity.toPrimitives(), id });

    return this.findById(id).then((plan) => plan!);
  }

  update(entity: PlanInternetEntity): Promise<PlanInternetEntity> {
    const fila = this.filas.get(entity.id!);
    if (fila?.eliminadoEn !== null) {
      return Promise.reject(new PlanInternetModificadoError());
    }
    // Como el adaptador real, no escribe el precio.
    this.filas.set(entity.id!, {
      ...entity.toPrimitives(),
      precio: fila.precio,
    });

    return Promise.resolve(entity);
  }

  guardarPrecio(entity: PlanInternetEntity): Promise<void> {
    const fila = this.filas.get(entity.id!)!;
    this.filas.set(entity.id!, { ...fila, precio: entity.precio });
    this.pasos.push(`precio ${entity.id}`);

    return Promise.resolve();
  }

  bloquearNombres(): Promise<void> {
    this.pasos.push('nombres');
    return Promise.resolve();
  }

  existeNombre(nombre: string, excluirId?: number): Promise<boolean> {
    return Promise.resolve(
      [...this.filas.values()].some(
        (fila) =>
          fila.eliminadoEn === null &&
          fila.id !== excluirId &&
          mismoNombre(fila.nombre, nombre),
      ),
    );
  }

  bloquearParaAsignar(id: number): Promise<void> {
    this.pasos.push(`compartido ${id}`);
    return Promise.resolve();
  }

  bloquearParaModificar(id: number): Promise<void> {
    this.pasos.push(`exclusivo ${id}`);
    return Promise.resolve();
  }

  clienteTienePlan(planId: number, clienteId: number): Promise<boolean> {
    return Promise.resolve(this.asignados.has(`${planId}:${clienteId}`));
  }

  contarClientes(id: number): Promise<ClientesDelPlan> {
    return Promise.resolve(
      this.clientes.get(id) ?? { total: 0, facturables: 0 },
    );
  }

  contarUso(id: number): Promise<UsoPlanInternet> {
    return Promise.resolve(this.usos.get(id) ?? SIN_USO);
  }

  eliminar(entity: PlanInternetEntity): Promise<void> {
    this.filas.set(entity.id!, entity.toPrimitives());
    this.pasos.push(`eliminado ${entity.id}`);

    return Promise.resolve();
  }
}
