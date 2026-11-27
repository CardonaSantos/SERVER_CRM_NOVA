import { DestinoTiempoReal, TiempoRealPort } from './tiempo-real.port';

export type EventoEmitido = {
  evento: string;
  datos: object;
  destino: DestinoTiempoReal;
};

/** Doble de pruebas: guarda lo emitido. */
export class TiempoRealEnMemoria implements TiempoRealPort {
  readonly emitidos: EventoEmitido[] = [];

  /** Si se asigna, `emitir` lanza (para probar que el adaptador no propaga). */
  falla: Error | null = null;

  emitir(evento: string, datos: object, destino: DestinoTiempoReal): void {
    if (this.falla) throw this.falla;
    this.emitidos.push({ evento, datos, destino });
  }
}
