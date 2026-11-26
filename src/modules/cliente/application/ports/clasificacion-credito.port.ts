import { FacturaHistorialReadModel } from '../../domain/read-models/cliente-listado.read-model';

export const CLASIFICACION_CREDITO = Symbol('CLASIFICACION_CREDITO');

export type ClasificacionCredito = {
  puntualidadPct: number;
  promedioAtraso: number;
  medianaAtraso: number;
  rachaActual: number;
  score: number;
  clasificacion: string;
};

/** Qué tan puntual paga un cliente, según el módulo de crédito. */
export interface ClasificacionCreditoPort {
  clasificar(
    facturas: FacturaHistorialReadModel[],
  ): Promise<ClasificacionCredito>;
}
