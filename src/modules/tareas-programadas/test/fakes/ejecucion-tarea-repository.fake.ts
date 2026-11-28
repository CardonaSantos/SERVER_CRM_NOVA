import { EjecucionTareaEntity } from '../../domain/entities/ejecucion-tarea.entity';
import { EstadoEjecucionTarea } from '../../domain/enums/ejecucion-tarea.enum';
import {
  EjecucionTareaRepositoryPort,
  VersionEjecucionTarea,
} from '../../domain/ports/ejecucion-tarea-repository.port';
import { EjecucionTareaProps } from '../../domain/props/ejecucion-tarea.props';

/** Registro en memoria con las mismas condiciones que el adaptador Prisma. */
export class EjecucionTareaRepositoryFake
  implements EjecucionTareaRepositoryPort
{
  readonly filas = new Map<string, EjecucionTareaProps>();
  private siguienteId = 1;

  /** Simula que otra instancia inserta la clave justo antes que nosotros. */
  antesDeCrear: (() => void) | null = null;

  async borrarAnterioresA(fecha: string) {
    let borradas = 0;
    for (const [clave, fila] of this.filas) {
      if (fila.fechaOperativa < fecha) {
        this.filas.delete(clave);
        borradas += 1;
      }
    }
    return borradas;
  }

  async findByClave(clave: string) {
    const fila = this.filas.get(clave);
    return fila ? EjecucionTareaEntity.hydrate({ ...fila }) : null;
  }

  async crear(ejecucion: EjecucionTareaEntity) {
    this.antesDeCrear?.();
    this.antesDeCrear = null;

    const props = ejecucion.toPrimitives();
    if (this.filas.has(props.clave)) return null;

    const guardada = { ...props, id: this.siguienteId++ };
    this.filas.set(props.clave, guardada);
    return EjecucionTareaEntity.hydrate({ ...guardada });
  }

  async retomar(
    ejecucion: EjecucionTareaEntity,
    anterior: VersionEjecucionTarea,
    ahora: Date,
  ) {
    const fila = this.filas.get(ejecucion.clave);
    if (!fila) return false;
    if (fila.estado !== anterior.estado || fila.intentos !== anterior.intentos)
      return false;
    if (
      anterior.estado === EstadoEjecucionTarea.EJECUTANDO &&
      fila.bloqueadoHasta &&
      fila.bloqueadoHasta.getTime() > ahora.getTime()
    ) {
      return false;
    }
    this.filas.set(ejecucion.clave, { ...ejecucion.toPrimitives() });
    return true;
  }

  async renovarArriendo(ejecucion: EjecucionTareaEntity) {
    const fila = this.esDeQuienLaTiene(ejecucion);
    if (!fila) return false;
    fila.bloqueadoHasta = ejecucion.bloqueadoHasta;
    return true;
  }

  async finalizar(ejecucion: EjecucionTareaEntity) {
    if (!this.esDeQuienLaTiene(ejecucion)) return false;
    this.filas.set(ejecucion.clave, { ...ejecucion.toPrimitives() });
    return true;
  }

  fila(clave: string): EjecucionTareaProps {
    const fila = this.filas.get(clave);
    if (!fila) throw new Error(`No hay ejecución con clave ${clave}`);
    return { ...fila };
  }

  /** Cambia una fila a mano (otra instancia, el paso del tiempo). */
  modificar(clave: string, cambios: Partial<EjecucionTareaProps>): void {
    this.filas.set(clave, { ...this.fila(clave), ...cambios });
  }

  private esDeQuienLaTiene(
    ejecucion: EjecucionTareaEntity,
  ): EjecucionTareaProps | null {
    const fila = this.filas.get(ejecucion.clave);
    return fila &&
      fila.estado === EstadoEjecucionTarea.EJECUTANDO &&
      fila.intentos === ejecucion.intentos
      ? fila
      : null;
  }
}
