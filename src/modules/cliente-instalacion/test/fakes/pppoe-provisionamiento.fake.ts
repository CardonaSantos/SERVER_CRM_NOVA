import {
  EjecutarOperacionPppoeResult,
  PppoeProvisionamientoPort,
} from 'src/modules/pppoe-automatizacion/public/pppoe-provisionamiento.port';
import {
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

type Peticion = {
  paso: 'crearSecret' | 'activarSecret';
  claveIdempotencia: string;
};

/** Motor PPPoE en memoria: cada llamada responde con `estado` y se anota. */
export class PppoeProvisionamientoFake
  implements Partial<PppoeProvisionamientoPort>
{
  readonly peticiones: Peticion[] = [];
  estadoPorPaso: Record<Peticion['paso'], EstadoOperacionPppoe> = {
    crearSecret: EstadoOperacionPppoe.EXITOSA,
    activarSecret: EstadoOperacionPppoe.EXITOSA,
  };
  errorMensaje: string | null = null;

  crearSecret(input: { claveIdempotencia: string; cuentaPppoeId: number }) {
    return this.responder(
      'crearSecret',
      input,
      TipoOperacionPppoe.CREAR_SECRET,
    );
  }

  activarSecret(input: { claveIdempotencia: string; cuentaPppoeId: number }) {
    return this.responder(
      'activarSecret',
      input,
      TipoOperacionPppoe.ACTIVAR_SECRET,
    );
  }

  private responder(
    paso: Peticion['paso'],
    input: { claveIdempotencia: string; cuentaPppoeId: number },
    tipo: TipoOperacionPppoe,
  ): Promise<EjecutarOperacionPppoeResult> {
    this.peticiones.push({ paso, claveIdempotencia: input.claveIdempotencia });

    return Promise.resolve({
      operacionId: this.peticiones.length,
      cuentaPppoeId: input.cuentaPppoeId,
      tipo,
      estadoOperacion: this.estadoPorPaso[paso],
      estadoCuenta: null,
      numeroIntento: 1,
      reintentable: false,
      resultado: null,
      errorCodigo: null,
      errorMensaje: this.errorMensaje,
    });
  }
}
