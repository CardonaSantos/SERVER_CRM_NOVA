import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';

export const PPPOE_PREALTA = Symbol('PPPOE_PREALTA');

export interface PppoePrealtaPort {
  preparar(
    input: PrepararPrealtaPppoeInput,
  ): Promise<PrepararPrealtaPppoeResult>;
}

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

export type PrepararPrealtaPppoeResult = {
  cuentaPppoeId: number;

  empresaId: number;
  accesoInternetId: number;
  perfilHomologacionId: number;

  usuario: string;
  estado: EstadoCuentaPppoe;

  generadoEn: Date;

  /**
   * true:
   * se creó una nueva cuenta PPPoE.
   *
   * false:
   * ya existía una prealta válida para el acceso.
   */
  creada: boolean;
};
