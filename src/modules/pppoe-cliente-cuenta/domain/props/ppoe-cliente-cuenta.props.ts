import { EstadoCuentaPppoe } from '../enums/pppoe-cliente-cuenta.enum';

export type CrearClientePppoeCuentaEntityProps = {
  empresaId: number;

  accesoInternetId: number;
  perfilHomologacionId: number;

  usuario: string;

  secretoCifrado: string;
  secretoIv: string;
  secretoAuthTag: string;
  versionClave: number;

  generadoPorId?: number | null;
};

export type AdoptarClientePppoeCuentaEntityProps = {
  empresaId: number;

  accesoInternetId: number;
  perfilHomologacionId: number;

  /**
   * Usuario PPPoE existente.
   *
   * Es libre y NO se deriva del clienteId.
   */
  usuario: string;

  /**
   * La contraseña ya fue verificada contra MikroTik
   * y cifrada antes de llegar a la entidad.
   */
  secretoCifrado: string;
  secretoIv: string;
  secretoAuthTag: string;
  versionClave: number;

  /**
   * Estado realmente observado en MikroTik.
   *
   * Una adopción inicial solamente puede registrar
   * un secret que ya está habilitado o suspendido.
   */
  estadoRemoto: EstadoCuentaPppoe.ACTIVA | EstadoCuentaPppoe.SUSPENDIDA;

  /**
   * Operador que realizó la adopción.
   */
  adoptadoPorId: number;

  /**
   * Momento en que CRM verificó e incorporó
   * formalmente la cuenta.
   */
  fechaAdopcion?: Date;
};

export type ClientePppoeCuentaEntityProps = {
  id: number | null;

  empresaId: number;

  accesoInternetId: number;
  perfilHomologacionId: number;

  usuario: string;

  secretoCifrado: string;
  secretoIv: string;
  secretoAuthTag: string;
  versionClave: number;

  estado: EstadoCuentaPppoe;

  generadoPorId: number | null;

  adoptadoPorId: number | null;

  generadoEn: Date;

  secretCreadoEn: Date | null;
  activadoEn: Date | null;
  suspendidoEn: Date | null;
  eliminadoEn: Date | null;
  adoptadoEn: Date | null;
  ultimaSincronizacionEn: Date | null;

  ultimoError: string | null;

  actualizadoEn: Date;
};
