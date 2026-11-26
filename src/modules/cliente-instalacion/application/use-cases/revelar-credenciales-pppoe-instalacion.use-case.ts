import { Inject, Injectable } from '@nestjs/common';
import {
  ConsultarCredencialesPppoeInstalacionResult,
  PPPOE_CLIENTE_CUENTA,
  PppoeClienteCuentaFacadePort,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';

export type RevelarCredencialesPppoeInstalacionInput = {
  instalacionId: number;
  operadorId: number;
  operadorNombre?: string | null;
  ipOrigen?: string | null;
  userAgent?: string | null;
};

/** Descifra las credenciales PPPoE de la instalación; la consulta queda en la bitácora. */
@Injectable()
export class RevelarCredencialesPppoeInstalacionUseCase {
  constructor(
    @Inject(PPPOE_CLIENTE_CUENTA)
    private readonly cuentasPppoe: PppoeClienteCuentaFacadePort,
  ) {}

  execute(
    input: RevelarCredencialesPppoeInstalacionInput,
  ): Promise<ConsultarCredencialesPppoeInstalacionResult> {
    return this.cuentasPppoe.consultarCredencialesInstalacion({
      instalacionId: input.instalacionId,
      operadorId: input.operadorId,
      operadorNombre: input.operadorNombre ?? null,
      ipOrigen: input.ipOrigen ?? null,
      userAgent: input.userAgent ?? null,
    });
  }
}
