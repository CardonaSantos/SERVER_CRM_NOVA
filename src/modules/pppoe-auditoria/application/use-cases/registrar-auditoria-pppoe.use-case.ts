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

  /** Devuelve el id de la auditoría creada. */
  async execute(input: RegistrarAuditoriaPppoeInput): Promise<number> {
    const guardada = await this.repositorio.create(this.construir(input));
    return guardada.id!;
  }

  private construir(input: RegistrarAuditoriaPppoeInput): PppoeAuditoriaEntity {
    const { evento, ...datos } = input;
    const creadoEn = input.creadoEn ?? this.reloj.ahora();

    switch (evento) {
      case 'CUENTA':
        return PppoeAuditoriaEntity.registrarEventoCuenta({
          ...(datos as RegistrarEventoCuentaInput),
          creadoEn,
        });
      case 'TRANSICION_CUENTA':
        return PppoeAuditoriaEntity.registrarTransicionCuenta({
          ...(datos as RegistrarTransicionCuentaInput),
          creadoEn,
        });
      case 'OPERACION':
        return PppoeAuditoriaEntity.registrarEventoOperacion({
          ...(datos as RegistrarEventoOperacionInput),
          creadoEn,
        });
      default: {
        const exhaustivo: never = evento;
        throw new Error(
          `Evento de auditoría no soportado: ${String(exhaustivo)}`,
        );
      }
    }
  }
}
