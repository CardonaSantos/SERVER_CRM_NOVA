import {
  TemporizadorActivo,
  TemporizadorPort,
} from '../../application/ports/temporizador.port';

/** Las vueltas corren solo cuando la prueba llama a `disparar()`. */
export class TemporizadorFake implements TemporizadorPort {
  private readonly activos = new Set<() => Promise<void>>();
  detenidos = 0;

  repetir(
    _intervaloMs: number,
    trabajo: () => Promise<void>,
  ): TemporizadorActivo {
    this.activos.add(trabajo);
    return {
      detener: async () => {
        if (this.activos.delete(trabajo)) this.detenidos += 1;
      },
    };
  }

  async disparar(): Promise<void> {
    for (const trabajo of [...this.activos]) await trabajo();
  }

  get cantidadActivos(): number {
    return this.activos.size;
  }
}
