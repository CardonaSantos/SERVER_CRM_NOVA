import { EstadoCuentaPppoe } from '../enums/pppoe-cliente-cuenta.enum';

export type ClientePppoeCuentaProtegidaInstalacion = {
  cuentaPppoeId: number;

  empresaId: number;
  clienteId: number;

  accesoInternetId: number;

  perfilHomologacionId: number;

  mikrotikRouterId: number;
  servicioInternetId: number;

  codigoPerfil: string;

  usuario: string;

  /**
   * Material criptográfico protegido.
   *
   * Estos valores no deben enviarse al frontend.
   * Solamente los utiliza el caso de uso para descifrar
   * temporalmente la contraseña.
   */
  secretoCifrado: string;
  secretoIv: string;
  secretoAuthTag: string;
  versionClave: number;

  estadoCuenta: EstadoCuentaPppoe;

  generadoEn: Date;
};
