import { ConsultarCredencialesPppoeInstalacionInput } from '../../application/inputs/consultar-credenciales-pppoe-instalacion.input';
import { ConsultarCredencialesPppoeInstalacionResult } from '../../application/inputs/consultar-credenciales-pppoe-instalacion.result';

export const PPPOE_CREDENCIALES_INSTALACION = Symbol(
  'PPPOE_CREDENCIALES_INSTALACION',
);

export interface PppoeCredencialesInstalacionPort {
  consultar(
    input: ConsultarCredencialesPppoeInstalacionInput,
  ): Promise<ConsultarCredencialesPppoeInstalacionResult>;
}
