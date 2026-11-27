import { Injectable, Logger } from '@nestjs/common';
import { EjecutarCampaniaUseCase } from '../use-cases/ejecutar-campania.use-case';

/** Lanza el envío en segundo plano, sin hacer esperar a quien lo pidió. */
@Injectable()
export class DespachadorCampaniasService {
  private readonly logger = new Logger(DespachadorCampaniasService.name);
  private readonly enviando = new Map<number, Promise<void>>();

  constructor(private readonly ejecutar: EjecutarCampaniaUseCase) {}

  despachar(campaniaId: number): void {
    if (this.enviando.has(campaniaId)) return;

    const envio = this.ejecutar
      .execute({ campaniaId })
      .catch((error: unknown) => {
        // Queda detenida: pasa a interrumpida y se puede reanudar.
        const nombre = error instanceof Error ? error.name : 'desconocido';
        this.logger.error(`Campaña ${campaniaId} detenida: ${nombre}`);
      })
      .finally(() => this.enviando.delete(campaniaId));
    this.enviando.set(campaniaId, envio);
  }

  /** Se resuelve cuando termina el envío en curso de esa campaña. */
  async esperar(campaniaId: number): Promise<void> {
    await this.enviando.get(campaniaId);
  }
}
