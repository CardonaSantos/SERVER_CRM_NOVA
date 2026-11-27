import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';

import { RegistrarDispositivoPushUseCase } from '../../application/use-cases/registrar-dispositivo-push.use-case';
import { RevocarDispositivoPushUseCase } from '../../application/use-cases/revocar-dispositivo-push.use-case';
import { RegistrarDispositivoPushDto } from '../dto/registrar-dispositivo-push.dto';
import { NotificacionPresenter } from '../presenters/notificacion.presenter';

/** Teléfono de quien tiene la sesión. `instalacionId` es el UUID estable de la instalación de la app. */
@ApiTags('push-dispositivos')
@Controller('push-dispositivos')
export class DispositivoPushController {
  constructor(
    private readonly registrarDispositivo: RegistrarDispositivoPushUseCase,
    private readonly revocarDispositivo: RevocarDispositivoPushUseCase,
  ) {}

  /** Registra o refresca la instalación (idempotente). Queda ligada a esta sesión. */
  @Put(':instalacionId')
  async registrar(
    @Param('instalacionId', new ParseUUIDPipe({ version: '4' }))
    instalacionId: string,
    @Body() dto: RegistrarDispositivoPushDto,
    @Actor() actor: ActorHttp,
  ) {
    const registrado = await this.registrarDispositivo.execute({
      usuarioId: actor.usuarioId,
      sesionId: actor.sesionId,
      instalacionId,
      token: dto.token,
      nombreDispositivo: dto.nombreDispositivo,
      modeloDispositivo: dto.modeloDispositivo,
      versionApp: dto.versionApp,
    });

    return NotificacionPresenter.dispositivo(registrado);
  }

  /** Deja de recibir push en esa instalación. Idempotente. */
  @Delete(':instalacionId')
  async revocar(
    @Param('instalacionId', new ParseUUIDPipe({ version: '4' }))
    instalacionId: string,
    @Actor() actor: ActorHttp,
  ) {
    return NotificacionPresenter.dispositivoRevocado(
      await this.revocarDispositivo.execute({
        usuarioId: actor.usuarioId,
        instalacionId,
      }),
    );
  }
}
