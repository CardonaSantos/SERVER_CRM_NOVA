export const PPPOE_CREDENTIAL_GENERATOR = Symbol('PPPOE_CREDENTIAL_GENERATOR');

export type GenerarCredencialesPppoeInput = {
  clienteId: number;

  /**
   * Instante de generación. Si se omite, se usa la hora del reloj del
   * negocio (RELOJ). Se permite suministrarla para pruebas.
   */
  fecha?: Date;
};

export type CredencialesPppoeGeneradas = {
  usuario: string;
  secretoPlano: string;
  generadoEn: Date;
};

/** Genera el usuario y la contraseña PPPoE de una cuenta nueva. */
export interface PppoeCredentialGeneratorPort {
  generate(input: GenerarCredencialesPppoeInput): CredencialesPppoeGeneradas;
}
