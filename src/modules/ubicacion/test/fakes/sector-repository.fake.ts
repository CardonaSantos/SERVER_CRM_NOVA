import { SectorEntity } from '../../domain/entities/sector.entity';
import { SectorModificadoError } from '../../domain/errors/ubicacion.errors';
import { SectorRepositoryPort } from '../../domain/ports/sector-repository.port';
import { SectorProps } from '../../domain/props/sector.props';

export class SectorRepositoryFake implements SectorRepositoryPort {
  readonly filas = new Map<number, SectorProps>();
  readonly clientes = new Map<number, number>();
  /** Bloqueos y escrituras, en orden. */
  readonly pasos: string[] = [];
  private siguienteId = 1;

  sembrar(cambios: Partial<SectorProps> = {}): number {
    const id = cambios.id ?? this.siguienteId++;
    this.filas.set(id, {
      nombre: `Sector ${id}`,
      descripcion: null,
      municipioId: 10,
      creadoEn: new Date('2026-01-01T00:00:00Z'),
      actualizadoEn: new Date('2026-01-01T00:00:00Z'),
      eliminadoEn: null,
      eliminadoPorId: null,
      ...cambios,
      id,
    });
    return id;
  }

  findById(id: number): Promise<SectorEntity | null> {
    const fila = this.filas.get(id);

    return Promise.resolve(fila ? SectorEntity.hydrate({ ...fila }) : null);
  }

  create(entity: SectorEntity): Promise<SectorEntity> {
    const id = this.siguienteId++;
    this.filas.set(id, { ...entity.toPrimitives(), id });

    return this.findById(id).then((sector) => sector!);
  }

  update(entity: SectorEntity): Promise<SectorEntity> {
    if (this.filas.get(entity.id!)?.eliminadoEn !== null) {
      return Promise.reject(new SectorModificadoError());
    }
    this.filas.set(entity.id!, entity.toPrimitives());

    return Promise.resolve(entity);
  }

  bloquearNombres(): Promise<void> {
    this.pasos.push('nombres');
    return Promise.resolve();
  }

  existeNombre(
    nombre: string,
    municipioId: number,
    excluirId?: number,
  ): Promise<boolean> {
    return Promise.resolve(
      [...this.filas.values()].some(
        (fila) =>
          fila.eliminadoEn === null &&
          fila.id !== excluirId &&
          fila.municipioId === municipioId &&
          fila.nombre.toLowerCase() === nombre.toLowerCase(),
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

  contarClientes(id: number): Promise<number> {
    return Promise.resolve(this.clientes.get(id) ?? 0);
  }

  eliminar(entity: SectorEntity): Promise<void> {
    this.filas.set(entity.id!, entity.toPrimitives());
    this.pasos.push(`eliminado ${entity.id}`);

    return Promise.resolve();
  }
}
