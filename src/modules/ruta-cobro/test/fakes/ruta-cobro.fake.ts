import { RutaCobroEventosPort } from '../../application/ports/ruta-cobro-eventos.port';
import { RutaCobroEntity } from '../../domain/entities/ruta-cobro.entity';
import { EstadoRutaCobro } from '../../domain/enums/estado-ruta-cobro.enum';
import { ReferenciaRutaQueryPort } from '../../domain/ports/referencia-ruta-query.port';
import { RutaCobroRepositoryPort } from '../../domain/ports/ruta-cobro-repository.port';
import { RutaCobroProps } from '../../domain/props/ruta-cobro.props';

export const FECHA_RUTA = new Date('2026-11-01T06:00:00.000Z');

/** Rutas en memoria. Cada lectura devuelve una copia, como la base de datos. */
export class RutaCobroRepositoryFake implements RutaCobroRepositoryPort {
  readonly filas = new Map<number, RutaCobroProps>();
  readonly bloqueos: string[] = [];
  /** Por cada `update`, si se escribieron los clientes. */
  readonly escriturasDeClientes: boolean[] = [];
  private siguienteId = 1;

  sembrar(cambios: Partial<RutaCobroProps> = {}): number {
    const id = cambios.id ?? this.siguienteId++;
    this.filas.set(id, {
      empresaId: 1,
      nombre: 'Ruta centro',
      cobradorId: 4,
      estado: EstadoRutaCobro.ASIGNADA,
      observaciones: null,
      clienteIds: [7, 8],
      creadoEn: FECHA_RUTA,
      actualizadoEn: FECHA_RUTA,
      eliminadoEn: null,
      eliminadoPorId: null,
      ...cambios,
      id,
    });

    return id;
  }

  bloquearParaModificar(id: number): Promise<void> {
    this.bloqueos.push(`modificar:${id}`);
    return Promise.resolve();
  }

  bloquearParaCobrar(id: number): Promise<void> {
    this.bloqueos.push(`cobrar:${id}`);
    return Promise.resolve();
  }

  findById(id: number): Promise<RutaCobroEntity | null> {
    const fila = this.filas.get(id);

    return Promise.resolve(fila ? RutaCobroEntity.hydrate({ ...fila }) : null);
  }

  create(entity: RutaCobroEntity): Promise<RutaCobroEntity> {
    const id = this.sembrar({
      ...entity.toPrimitives(),
      id: this.siguienteId++,
    });

    return Promise.resolve(RutaCobroEntity.hydrate({ ...this.filas.get(id)! }));
  }

  update(
    entity: RutaCobroEntity,
    opciones: { clientes: boolean } = { clientes: false },
  ): Promise<void> {
    const datos = entity.toPrimitives();
    this.escriturasDeClientes.push(opciones.clientes);
    this.filas.set(entity.id!, {
      ...datos,
      clienteIds: opciones.clientes
        ? datos.clienteIds
        : this.filas.get(entity.id!)!.clienteIds,
    });

    return Promise.resolve();
  }
}

export class ReferenciaRutaFake implements ReferenciaRutaQueryPort {
  cobradoresActivos = new Set([4, 5]);
  clientesAsignables = new Set([7, 8, 9]);

  existeCobradorActivo(usuarioId: number): Promise<boolean> {
    return Promise.resolve(this.cobradoresActivos.has(usuarioId));
  }

  contarClientesAsignables(clienteIds: number[]): Promise<number> {
    return Promise.resolve(
      clienteIds.filter((id) => this.clientesAsignables.has(id)).length,
    );
  }
}

export class RutaCobroEventosFake implements RutaCobroEventosPort {
  readonly avisos: { empresaId: number; rutaId: number }[] = [];

  rutaCambiada(empresaId: number, rutaId: number): Promise<void> {
    this.avisos.push({ empresaId, rutaId });
    return Promise.resolve();
  }
}
