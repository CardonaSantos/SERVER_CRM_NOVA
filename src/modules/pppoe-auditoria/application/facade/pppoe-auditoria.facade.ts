import { Injectable } from '@nestjs/common';

import {
  PppoeAuditoriaFacadePort,
  RegistrarEventoCuentaInput,
  RegistrarEventoOperacionInput,
  RegistrarTransicionCuentaInput,
} from '../../public/pppoe-auditoria.facade.port';
import { RegistrarAuditoriaPppoeUseCase } from '../use-cases/registrar-auditoria-pppoe.use-case';

@Injectable()
export class PppoeAuditoriaFacade implements PppoeAuditoriaFacadePort {
  constructor(private readonly registrar: RegistrarAuditoriaPppoeUseCase) {}

  registrarEventoCuenta(input: RegistrarEventoCuentaInput): Promise<number> {
    return this.registrar.execute({ evento: 'CUENTA', ...input });
  }

  registrarTransicionCuenta(
    input: RegistrarTransicionCuentaInput,
  ): Promise<number> {
    return this.registrar.execute({ evento: 'TRANSICION_CUENTA', ...input });
  }

  registrarEventoOperacion(
    input: RegistrarEventoOperacionInput,
  ): Promise<number> {
    return this.registrar.execute({ evento: 'OPERACION', ...input });
  }
}
