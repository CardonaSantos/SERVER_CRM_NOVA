export const MENSAJERIA_CLIENTE = Symbol('MENSAJERIA_CLIENTE');

export type EnviarAvisoInput = {
  /** Teléfono ya normalizado con `normalizarTelefonos`. */
  telefono: string;
  /** Nombre de la plantilla aprobada (en español). */
  plantilla: string;
  /** Valores de las variables del cuerpo, en orden. */
  variables: string[];
};

export interface MensajeriaClienteFacadePort {
  /** Números listos para enviar; no quita repetidos. */
  normalizarTelefonos(crudos: Array<string | null | undefined>): string[];

  /** Envía un aviso por WhatsApp. Lanza si no se pudo o no se confirmó. */
  enviarPlantilla(
    input: EnviarAvisoInput,
  ): Promise<{ mensajeId: string | null }>;
}
