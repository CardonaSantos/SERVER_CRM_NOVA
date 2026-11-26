import {
  EjecutarOperacionPppoeResult,
  EliminarSecretPppoeInput,
  PppoeProvisionamientoPort,
} from 'src/modules/pppoe-automatizacion/public/pppoe-provisionamiento.port';
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';
import {
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

/** Motor PPPoE en memoria: `eliminarSecret` anota la petición y responde `estadoCuenta`. */
export class PppoeProvisionamientoFake
  implements Partial<PppoeProvisionamientoPort>
{
  readonly peticiones: EliminarSecretPppoeInput[] = [];
  estadoCuenta: EstadoCuentaPppoe | null = EstadoCuentaPppoe.ELIMINADA;
  /** Se ejecuta justo antes de responder; sirve para observar el estado local. */
  alResponder: (() => void) | null = null;
  falla: Error | null = null;

  eliminarSecret(
    input: EliminarSecretPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult> {
    this.peticiones.push(input);
    this.alResponder?.();

    if (this.falla) {
      return Promise.reject(this.falla);
    }

    return Promise.resolve({
      operacionId: 77,
      cuentaPppoeId: input.cuentaPppoeId,
      tipo: TipoOperacionPppoe.ELIMINAR_SECRET,
      estadoOperacion: EstadoOperacionPppoe.EXITOSA,
      estadoCuenta: this.estadoCuenta,
      numeroIntento: 1,
      reintentable: false,
      resultado: null,
      errorCodigo: null,
      errorMensaje: null,
    });
  }
}
