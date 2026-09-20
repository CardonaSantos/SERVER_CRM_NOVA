import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

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
