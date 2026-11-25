import { fechaNegocioDe } from './fecha-negocio';
import { RelojPort } from './reloj.port';

/**
 * Reloj controlable para pruebas.
 *
 * @example
 * const reloj = new RelojFijo('2026-11-24T16:00:00Z');
 * const useCase = new CrearZonaFacturacionUseCase(repoFake, reloj);
 * reloj.avanzar({ dias: 1 });
 */
export class RelojFijo implements RelojPort {
  private instante: Date;

  constructor(instante: Date | string = '2026-01-01T12:00:00.000Z') {
    this.instante = new Date(instante);
  }

  ahora(): Date {
    return new Date(this.instante);
  }

  fechaOperativa(): string {
    return fechaNegocioDe(this.instante);
  }

  establecer(instante: Date | string): void {
    this.instante = new Date(instante);
  }

  avanzar(delta: { dias?: number; horas?: number; minutos?: number }): void {
    const ms =
      (delta.dias ?? 0) * 86_400_000 +
      (delta.horas ?? 0) * 3_600_000 +
      (delta.minutos ?? 0) * 60_000;

    this.instante = new Date(this.instante.getTime() + ms);
  }
}
