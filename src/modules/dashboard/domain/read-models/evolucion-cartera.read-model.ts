import { CifrasFotoMensual } from '../props/foto-mensual-cartera.props';

/** Una foto guardada, tal como se lee. */
export type FotoMensualCarteraReadModel = CifrasFotoMensual & {
  /** `YYYY-MM` del mes que cerró. */
  mes: string;
  tomadaEn: Date;
};

/** Un mes de la gráfica: sin foto, todas sus cifras son `null`. */
export type MesEvolucionCartera = {
  mes: string;
  tomadaEn: Date | null;
} & { [K in keyof CifrasFotoMensual]: number | null };

export type EvolucionCarteraReadModel = {
  periodo: { desde: string; hasta: string };
  meses: MesEvolucionCartera[];
};
