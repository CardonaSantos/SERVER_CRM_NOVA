import {
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/domain/enums/ppoe-acceso-internet.enum';

export enum ModoAccesoInstalacion {
  NUEVO = 'NUEVO',
  EXISTENTE = 'EXISTENTE',
}

export type CrearAccesoNuevoInstalacionInput = {
  modo: ModoAccesoInstalacion.NUEVO;

  tecnologia: TecnologiaAccesoInternet;
  metodoAutenticacion: MetodoAutenticacionInternet;

  /**
   * Obligatorio actualmente para FIBRA_GPON + PPPOE.
   * Permitirá resolver el perfil homologado.
   */
  mikrotikRouterId?: number | null;
};

export type VincularAccesoExistenteInstalacionInput = {
  modo: ModoAccesoInstalacion.EXISTENTE;

  accesoInternetId: number;
};

export type AccesoInstalacionInput =
  | CrearAccesoNuevoInstalacionInput
  | VincularAccesoExistenteInstalacionInput;
