import {
  ActualizarPasoPppoeOperacionInput,
  PppoeOperacionFacadePort,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.facade.port';
import { PppoeOperacionAgregadoReadModel } from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

type Accion = ActualizarPasoPppoeOperacionInput['accion'];

/**
 * Fachada de operaciones que solo registra los cambios de paso. Los demás
 * métodos fallan: una prueba que los necesite debe ampliar este fake.
 */
export class PppoeOperacionFacadeFake implements PppoeOperacionFacadePort {
  readonly pasos: ActualizarPasoPppoeOperacionInput[] = [];

  /** Acciones de paso que fallarán al persistirse. */
  readonly fallarAl = new Set<Accion>();

  get acciones(): Accion[] {
    return this.pasos.map((p) => p.accion);
  }

  actualizarPaso(
    input: ActualizarPasoPppoeOperacionInput,
  ): Promise<PppoeOperacionAgregadoReadModel> {
    if (this.fallarAl.has(input.accion)) {
      return Promise.reject(new Error(`BD caída al ${input.accion}`));
    }
    this.pasos.push(input);
    return Promise.resolve({} as PppoeOperacionAgregadoReadModel);
  }

  buscar = noUsado;
  buscarAgregado = noUsado;
  crear = noUsado;
  autorizar = noUsado;
  iniciar = noUsado;
  finalizar = noUsado;
  cancelar = noUsado;
  crearReintento = noUsado;
  listar = noUsado;
  obtenerDetalle = noUsado;
}

function noUsado(): never {
  throw new Error('Método de la fachada no usado en esta prueba.');
}
