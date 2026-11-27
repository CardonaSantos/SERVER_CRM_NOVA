import { ServicioAdicionalEntity } from '../../domain/entities/servicio-adicional.entity';
import { EstadoServicio } from '../../domain/enums/estado-servicio.enum';
import { ServicioAdicionalModificadoError } from '../../domain/errors/servicio.errors';
import { mismoNombre } from '../../domain/policies/catalogo.policy';
import {
  ServicioAdicionalRepositoryPort,
  UsoServicioAdicional,
} from '../../domain/ports/servicio-adicional-repository.port';
import { ServicioAdicionalProps } from '../../domain/props/servicio-adicional.props';

export class ServicioAdicionalRepositoryFake
  implements ServicioAdicionalRepositoryPort
{
  readonly filas = new Map<number, ServicioAdicionalProps>();
  readonly usos = new Map<number, UsoServicioAdicional>();
  /** Pares `servicio:cliente` que el cliente ya tiene. */
  readonly asignados = new Set<string>();
  /** Bloqueos y escrituras, en orden. */
  readonly pasos: string[] = [];
  private siguienteId = 1;

  sembrar(cambios: Partial<ServicioAdicionalProps> = {}): number {
    const id = cambios.id ?? this.siguienteId++;
    this.filas.set(id, {
      empresaId: 1,
      nombre: `Servicio ${id}`,
      descripcion: null,
      precio: 25,
      estado: EstadoServicio.ACTIVO,
      tipoServicioId: null,
      creadoEn: new Date('2026-01-01T00:00:00Z'),
      actualizadoEn: new Date('2026-01-01T00:00:00Z'),
      eliminadoEn: null,
      eliminadoPorId: null,
      ...cambios,
      id,
    });
    return id;
  }

  findById(id: number): Promise<ServicioAdicionalEntity | null> {
    const fila = this.filas.get(id);

    return Promise.resolve(
      fila ? ServicioAdicionalEntity.hydrate({ ...fila }) : null,
    );
  }

  create(entity: ServicioAdicionalEntity): Promise<ServicioAdicionalEntity> {
    const id = this.siguienteId++;
    this.filas.set(id, { ...entity.toPrimitives(), id });

    return this.findById(id).then((servicio) => servicio!);
  }

  update(entity: ServicioAdicionalEntity): Promise<ServicioAdicionalEntity> {
    if (this.filas.get(entity.id!)?.eliminadoEn !== null) {
      return Promise.reject(new ServicioAdicionalModificadoError());
    }
    this.filas.set(entity.id!, entity.toPrimitives());

    return Promise.resolve(entity);
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

  clienteTieneServicio(
    servicioId: number,
    clienteId: number,
  ): Promise<boolean> {
    return Promise.resolve(this.asignados.has(`${servicioId}:${clienteId}`));
  }

  contarUso(id: number): Promise<UsoServicioAdicional> {
    return Promise.resolve(this.usos.get(id) ?? { clientes: 0, facturas: 0 });
  }

  eliminar(entity: ServicioAdicionalEntity): Promise<void> {
    this.filas.set(entity.id!, entity.toPrimitives());
    this.pasos.push(`eliminado ${entity.id}`);

    return Promise.resolve();
  }
}
