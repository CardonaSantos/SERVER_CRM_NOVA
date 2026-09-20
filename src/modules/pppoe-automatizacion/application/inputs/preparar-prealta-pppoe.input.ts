export type PrepararPrealtaPppoeInput = {
  empresaId: number;

  clienteId: number;
  accesoInternetId: number;
  servicioInternetId: number;
  mikrotikRouterId: number;

  instalacionId?: number | null;

  operadorId: number;
  operadorNombre?: string | null;

  ipOrigen?: string | null;
  userAgent?: string | null;

  /**
   * Permite controlar la fecha usada para generar
   * la contraseña durante pruebas o migraciones.
   *
   * En el flujo normal se utiliza la fecha actual.
   */
  fechaReferencia?: Date;
};
