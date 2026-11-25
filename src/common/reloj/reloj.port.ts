/**
 * Reloj del negocio (estándar §5.7).
 *
 * Los casos de uso piden la hora aquí y se la pasan a las entidades
 * (que nunca llaman a `new Date()`). En pruebas se usa `RelojFijo`.
 *
 * Zona horaria de negocio: America/Guatemala.
 */
export const RELOJ = Symbol('RELOJ');

export interface RelojPort {
  /** Instante actual. */
  ahora(): Date;

  /**
   * Fecha de negocio de hoy en America/Guatemala, `YYYY-MM-DD`.
   * Es la que decide "qué día es" para facturación, cortes y reportes
   * (a las 23:30 de Guatemala ya es mañana en UTC).
   */
  fechaOperativa(): string;
}
