import { ClienteInstalacionEntity } from '../domain/entities/cliente-instalacion.entity';

import { EjecutarOperacionPppoeResult } from 'src/modules/pppoe-automatizacion/domain/props/pppoe-provisionamiento.props';

export type ActivarPppoeInstalacionResult = {
  instalacion: ClienteInstalacionEntity;

  accesoInternetId: number;

  cuentaPppoeId: number;

  /**
   * Operación que crea o confirma la existencia
   * del secret en MikroTik.
   */
  // creacion: EjecutarOperacionPppoeResult;
  creacion: EjecutarOperacionPppoeResult | null;

  /**
   * Operación que habilita o confirma habilitado
   * el secret en MikroTik.
   */
  activacion: EjecutarOperacionPppoeResult;

  activadoEn: Date;
};
