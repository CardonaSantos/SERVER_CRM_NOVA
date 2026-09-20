import {
  EstadoPasoPppoe,
  TipoPasoPppoe,
} from '../enums/pppoe-operacion-operacion-paso.enums';

/**
 * Estado completo de un paso técnico.
 *
 * Se utiliza al hidratar la entidad desde persistencia
 * y para obtener todos sus valores primitivos.
 */
export type PppoeOperacionPasoProps = {
  id: number | null;

  operacionId: number;

  tipo: TipoPasoPppoe;

  /**
   * Posición del paso dentro de la operación.
   *
   * Debe comenzar en 1 y ser único dentro
   * de la misma operación.
   */
  orden: number;

  estado: EstadoPasoPppoe;

  /**
   * Nunca debe contener contraseñas, tokens
   * o material criptográfico.
   */
  comandoSanitizado: string | null;

  /**
   * Respuesta técnica limpia.
   *
   * No debe persistirse stdout/stderr sin
   * procesarlo previamente.
   */
  respuestaSanitizada: string | null;

  errorCodigo: string | null;
  errorMensaje: string | null;

  iniciadoEn: Date | null;
  finalizadoEn: Date | null;

  duracionMs: number | null;

  creadoEn: Date;
  actualizadoEn: Date;
};

/**
 * Datos permitidos al crear un paso después
 * de que la operación ya fue persistida.
 *
 * El estado inicial será PENDIENTE.
 */
export type CrearPppoeOperacionPasoProps = {
  operacionId: number;

  tipo: TipoPasoPppoe;

  orden: number;
};

/**
 * Paso inicial utilizado cuando operación y pasos
 * se crean mediante nested create.
 *
 * No contiene operacionId porque todavía no existe.
 */
export type CrearPppoeOperacionPasoInicialProps = {
  tipo: TipoPasoPppoe;

  orden: number;
};
