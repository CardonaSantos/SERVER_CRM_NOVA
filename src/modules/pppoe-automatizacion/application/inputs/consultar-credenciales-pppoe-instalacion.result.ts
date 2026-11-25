import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';

export type CredencialPppoeInstalacionItem = {
  cuentaPppoeId: number;

  accesoInternetId: number;

  perfilHomologacionId: number;

  mikrotikRouterId: number;

  servicioInternetId: number;

  codigoPerfil: string;

  usuario: string;

  /**
   * Contraseña descifrada temporalmente.
   *
   * No debe persistirse, registrarse en logs ni almacenarse
   * en estado global del frontend.
   */
  contrasena: string;

  estadoCuenta: EstadoCuentaPppoe;

  generadoEn: Date;
};

export type ConsultarCredencialesPppoeInstalacionResult = {
  instalacionId: number;

  credenciales: CredencialPppoeInstalacionItem[];
};
