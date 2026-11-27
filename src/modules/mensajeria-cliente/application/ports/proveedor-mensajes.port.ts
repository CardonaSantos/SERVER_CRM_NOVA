export const PROVEEDOR_MENSAJES = Symbol('PROVEEDOR_MENSAJES');

export type MensajePlantilla = {
  telefono: string;
  plantilla: string;
  idioma: string;
  /** Valores de las variables del cuerpo, en orden. */
  variables?: string[];
  imagenUrl?: string | null;
};

export interface ProveedorMensajesPort {
  /**
   * Envía una plantilla. Lanza `MensajeriaProveedorRechazoError` si la
   * rechazan, `MensajeriaProveedorNoDisponibleError` si con seguridad no salió
   * y `MensajeriaSinConfirmacionError` si no se sabe.
   */
  enviar(mensaje: MensajePlantilla): Promise<{ mensajeId: string | null }>;
}
