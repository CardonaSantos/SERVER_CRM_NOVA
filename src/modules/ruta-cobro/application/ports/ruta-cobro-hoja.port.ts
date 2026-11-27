import { RutaCobroDetalle } from '../../domain/read-models/ruta-cobro.read-model';

export const RUTA_COBRO_HOJA = Symbol('RUTA_COBRO_HOJA');

export interface RutaCobroHojaPort {
  /** Hoja de cálculo (.xlsx) con los clientes de la ruta. */
  generar(ruta: RutaCobroDetalle): Promise<Buffer>;
}
