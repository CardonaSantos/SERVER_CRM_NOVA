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

  generadoEn: Date;

  secretCreadoEn: Date | null;
  activadoEn: Date | null;
  suspendidoEn: Date | null;
  eliminadoEn: Date | null;

  ultimaSincronizacionEn: Date | null;

  ultimoError: string | null;

  actualizadoEn: Date;
};
