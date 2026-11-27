import { Injectable } from '@nestjs/common';

import {
  EnviarPushInput,
  EnviarPushResult,
  NotificacionFacadePort,
  NotificarInput,
  NotificarResult,
} from '../../public/notificacion.facade.port';
import { EnviarPushUseCase } from '../use-cases/enviar-push.use-case';
import { NotificarUseCase } from '../use-cases/notificar.use-case';

@Injectable()
export class NotificacionFacade implements NotificacionFacadePort {
  constructor(
    private readonly notificarUseCase: NotificarUseCase,
    private readonly enviarPushUseCase: EnviarPushUseCase,
  ) {}

  notificar(input: NotificarInput): Promise<NotificarResult> {
    return this.notificarUseCase.execute(input);
  }

  enviarPush(input: EnviarPushInput): Promise<EnviarPushResult> {
    return this.enviarPushUseCase.execute(input);
  }
}
