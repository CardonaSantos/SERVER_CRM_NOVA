import { AccionInstalacionAcceso } from '../enums/ppoe-instalacion-acceso.enum';

export type ClienteInstalacionAccesoProps = {
  id: number | null;

  instalacionId: number;
  accesoInternetId: number;

  accion: AccionInstalacionAcceso;

  creadoEn: Date;
};

export type CrearClienteInstalacionAccesoProps = Omit<
  ClienteInstalacionAccesoProps,
  'id' | 'creadoEn'
>;
