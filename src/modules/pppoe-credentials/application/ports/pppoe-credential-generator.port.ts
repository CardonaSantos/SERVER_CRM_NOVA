export type GenerarCredencialesPppoeInput = {
  clienteId: number;

  // /**
  //  * Identifica de forma única el acceso para el cual
  //  * se están generando las credenciales.
  //  */
  // accesoInternetId: number;

  /**
   * Se permite suministrarla para pruebas.
   * En producción normalmente se omite.
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
