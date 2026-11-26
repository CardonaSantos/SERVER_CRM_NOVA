import {
  ActualizarPasoPppoeOperacionInput,
  FinalizarPppoeOperacionInput,
  PppoeOperacionFacadePort,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.facade.port';
import {
  EstadoOperacionPppoe,
  EstadoPasoPppoe,
  PppoeOperacionAgregadoReadModel,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

import { conEstadoOperacion, conEstadoPaso } from './pppoe-read-models.fake';

type Accion = ActualizarPasoPppoeOperacionInput['accion'];

const ESTADO_TRAS: Record<Accion, EstadoPasoPppoe> = {
  INICIAR: EstadoPasoPppoe.EJECUTANDO,
  MARCAR_EXITOSO: EstadoPasoPppoe.EXITOSO,
  MARCAR_FALLIDO: EstadoPasoPppoe.FALLIDO,
  OMITIR: EstadoPasoPppoe.OMITIDO,
};

/**
 * Fachada de operaciones en memoria. Guarda una sola operación (`agregado`)
 * y registra cada cambio de paso y cada finalización. Los métodos que una
 * prueba no necesita fallan para que se note si se llaman.
 */
export class PppoeOperacionFacadeFake implements PppoeOperacionFacadePort {
  agregado: PppoeOperacionAgregadoReadModel | null = null;
  readonly pasos: ActualizarPasoPppoeOperacionInput[] = [];
  readonly finalizaciones: FinalizarPppoeOperacionInput[] = [];

  /** Acciones de paso que fallarán al persistirse. */
  readonly fallarAl = new Set<Accion>();

  get acciones(): Accion[] {
    return this.pasos.map((p) => p.accion);
  }

  buscarAgregado(): Promise<PppoeOperacionAgregadoReadModel | null> {
    return Promise.resolve(this.agregado);
  }

  actualizarPaso(
    input: ActualizarPasoPppoeOperacionInput,
  ): Promise<PppoeOperacionAgregadoReadModel> {
    if (this.fallarAl.has(input.accion)) {
      return Promise.reject(new Error(`BD caída al ${input.accion}`));
    }
    this.pasos.push(input);

    if (this.agregado) {
      const selector = input.selector as { orden?: number; pasoId?: number };
      this.agregado = {
        ...this.agregado,
        pasos: this.agregado.pasos.map((p) =>
          p.id === selector.pasoId || p.orden === selector.orden
            ? conEstadoPaso({ ...p, estado: ESTADO_TRAS[input.accion] })
            : p,
        ),
      };
    }
    return Promise.resolve(
      this.agregado ?? ({} as PppoeOperacionAgregadoReadModel),
    );
  }

  /** Reclama la operación: pasa a EJECUTANDO. */
  iniciar(): Promise<PppoeOperacionAgregadoReadModel> {
    if (!this.agregado) throw new Error('Sin operación en el fake.');
    this.agregado = {
      ...this.agregado,
      operacion: conEstadoOperacion({
        ...this.agregado.operacion,
        estado: EstadoOperacionPppoe.EJECUTANDO,
      }),
    };
    return Promise.resolve(this.agregado);
  }

  finalizar(
    input: FinalizarPppoeOperacionInput,
  ): Promise<PppoeOperacionAgregadoReadModel> {
    this.finalizaciones.push(input);
    if (!this.agregado) throw new Error('Sin operación en el fake.');
    const fin = input as FinalizarPppoeOperacionInput & {
      errorCodigo?: string | null;
      errorMensaje?: string | null;
    };
    this.agregado = {
      ...this.agregado,
      operacion: conEstadoOperacion({
        ...this.agregado.operacion,
        estado: fin.estadoFinal,
        errorCodigo: fin.errorCodigo ?? null,
        errorMensaje: fin.errorMensaje ?? null,
        resultado: fin.resultado ?? null,
        finalizadoEn: fin.fecha ?? null,
      }),
    };
    return Promise.resolve(this.agregado);
  }

  buscar = noUsado;
  crear = noUsado;
  autorizar = noUsado;
  cancelar = noUsado;
  crearReintento = noUsado;
  listar = noUsado;
  obtenerDetalle = noUsado;
}

function noUsado(): never {
  throw new Error('Método de la fachada no usado en esta prueba.');
}
