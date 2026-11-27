import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import {
  EVENTO_SESIONES_REVOCADAS,
  SesionesService,
} from 'src/auth/sesiones/sesiones.service';

import { RevocarDispositivosDeSesionesUseCase } from '../../application/use-cases/revocar-dispositivos-de-sesiones.use-case';

/** Cuando auth revoca sesiones, sus teléfonos dejan de recibir push. */
@Injectable()
export class SesionesRevocadasListener
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SesionesRevocadasListener.name);

  private readonly alRevocar = (sesionIds: string[]) => {
    this.revocar
      .execute({ sesionIds })
      .catch((error: unknown) =>
        this.logger.error(
          'No se pudieron revocar los dispositivos push de sesiones revocadas.',
          error instanceof Error ? error.stack : String(error),
        ),
      );
  };

  constructor(
    private readonly sesiones: SesionesService,
    private readonly revocar: RevocarDispositivosDeSesionesUseCase,
  ) {}

  onModuleInit(): void {
    this.sesiones.eventos.on(EVENTO_SESIONES_REVOCADAS, this.alRevocar);
  }

  onModuleDestroy(): void {
    this.sesiones.eventos.off(EVENTO_SESIONES_REVOCADAS, this.alRevocar);
  }
}
