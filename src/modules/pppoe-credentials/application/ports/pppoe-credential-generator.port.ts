export type GenerarCredencialesPppoeInput = {
  clienteId: number;

  /**
   * Se permite suministrarla para pruebas.
   * En producción  se omite.
   */
  fecha?: Date;
};

export type CredencialesPppoeGeneradas = {
  usuario: string;
  secretoPlano: string;
  generadoEn: Date;
};

export interface PppoeCredentialGeneratorPort {
  generate(input: GenerarCredencialesPppoeInput): CredencialesPppoeGeneradas;
}
