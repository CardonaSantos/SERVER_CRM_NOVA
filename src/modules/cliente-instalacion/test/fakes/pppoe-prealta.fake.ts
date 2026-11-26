import {
  PppoePrealtaPort,
  PrepararPrealtaPppoeInput,
  PrepararPrealtaPppoeResult,
} from 'src/modules/pppoe-automatizacion/public/pppoe-prealta.port';
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';

/** Prealta PPPoE en memoria; `falla` simula un error de la capa PPPoE. */
export class PppoePrealtaFake implements PppoePrealtaPort {
  readonly peticiones: PrepararPrealtaPppoeInput[] = [];
  falla: Error | null = null;
  creada = true;

  preparar(
    input: PrepararPrealtaPppoeInput,
  ): Promise<PrepararPrealtaPppoeResult> {
    this.peticiones.push(input);

    if (this.falla) {
      return Promise.reject(this.falla);
    }

    return Promise.resolve({
      cuentaPppoeId: 900,
      empresaId: input.empresaId,
      accesoInternetId: input.accesoInternetId,
      perfilHomologacionId: 12,
      usuario: 'cliente.7',
      estado: EstadoCuentaPppoe.PENDIENTE_ACTIVACION,
      generadoEn: new Date('2026-11-25T15:00:00Z'),
      creada: this.creada,
    });
  }
}
