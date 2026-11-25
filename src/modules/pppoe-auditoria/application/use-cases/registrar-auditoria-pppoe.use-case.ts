import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { PppoeAuditoriaEntity } from '../../domain/entities/pppoe-auditoria.entity';
import {
  PPPOE_AUDITORIA_REPOSITORY,
  PppoeAuditoriaRepositoryPort,
} from '../../domain/ports/pppoe-auditoria-repository.port';
import {
  RegistrarEventoCuentaInput,
  RegistrarEventoOperacionInput,
  RegistrarTransicionCuentaInput,
} from '../../public/pppoe-auditoria.facade.port';

export type RegistrarAuditoriaPppoeInput =
  | ({ evento: 'CUENTA' } & RegistrarEventoCuentaInput)
  | ({ evento: 'TRANSICION_CUENTA' } & RegistrarTransicionCuentaInput)
  | ({ evento: 'OPERACION' } & RegistrarEventoOperacionInput);

/** Agrega un evento a la bitácora (con la hora del reloj si no trae fecha). */
@Injectable()
export class RegistrarAuditoriaPppoeUseCase {
  constructor(
    @Inject(PPPOE_AUDITORIA_REPOSITORY)
    private readonly repositorio: PppoeAuditoriaRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: RegistrarAuditoriaPppoeInput): Promise<void> {
    const { evento, ...datos } = input;
    const creadoEn = input.creadoEn ?? this.reloj.ahora();

    switch (evento) {
      case 'CUENTA':
        await this.repositorio.create(
          PppoeAuditoriaEntity.registrarEventoCuenta({
            ...(datos as RegistrarEventoCuentaInput),
            creadoEn,
          }),
        );
        return;

      case 'TRANSICION_CUENTA':
        await this.repositorio.create(
          PppoeAuditoriaEntity.registrarTransicionCuenta({
            ...(datos as RegistrarTransicionCuentaInput),
            creadoEn,
          }),
        );
        return;

      case 'OPERACION':
        await this.repositorio.create(
          PppoeAuditoriaEntity.registrarEventoOperacion({
            ...(datos as RegistrarEventoOperacionInput),
            creadoEn,
          }),
        );
        return;

      default: {
        const exhaustivo: never = evento;
        throw new Error(
          `Evento de auditoría no soportado: ${String(exhaustivo)}`,
        );
      }
    }
  }
}
