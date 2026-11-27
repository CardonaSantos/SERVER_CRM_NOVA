import { Inject, Injectable, Logger } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { NotificacionEntity } from '../../domain/entities/notificacion.entity';
import { AudienciaNotificacion } from '../../domain/enums/audiencia-notificacion.enum';
import {
  NOTIFICACION_QUERY,
  NotificacionQueryPort,
} from '../../domain/ports/notificacion-query.port';
import {
  NOTIFICACION_REPOSITORY,
  NotificacionRepositoryPort,
} from '../../domain/ports/notificacion-repository.port';
import {
  NotificarInput,
  NotificarResult,
} from '../../public/notificacion.facade.port';
import {
  NOTIFICACION_EVENTOS,
  NotificacionEventosPort,
} from '../ports/notificacion-eventos.port';

@Injectable()
export class NotificarUseCase {
  private readonly logger = new Logger(NotificarUseCase.name);

  constructor(
    @Inject(NOTIFICACION_REPOSITORY)
    private readonly notificaciones: NotificacionRepositoryPort,
    @Inject(NOTIFICACION_QUERY)
    private readonly consulta: NotificacionQueryPort,
    @Inject(NOTIFICACION_EVENTOS)
    private readonly eventos: NotificacionEventosPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: NotificarInput): Promise<NotificarResult> {
    const { destino } = input;

    // Valida antes de consultar destinatarios: un dato inválido es del emisor.
    const notificacion = NotificacionEntity.create(
      {
        titulo: input.titulo,
        mensaje: input.mensaje,
        categoria: input.categoria,
        severidad: input.severidad,
        subtipo: input.subtipo,
        referencia: input.referencia,
        ruta: input.ruta,
        etiquetaAccion: input.etiquetaAccion,
        remitenteId: input.remitenteId,
        audiencia: destino.todos
          ? AudienciaNotificacion.TODOS
          : destino.roles?.length
            ? AudienciaNotificacion.ROL
            : AudienciaNotificacion.USUARIOS,
      },
      this.reloj.ahora(),
    );

    const destinatarios = await this.consulta.resolverDestinatarios(destino);

    if (destinatarios.length === 0) {
      this.logger.warn('Notificación sin destinatarios: no se guarda.');
      return { notificacionId: null, destinatarios: 0 };
    }

    const guardada = await this.notificaciones.create(
      notificacion,
      destinatarios,
    );
    const props = guardada.toPrimitives();

    await this.eventos.notificacionCreada(
      { ...props, id: props.id! },
      destinatarios,
    );

    return { notificacionId: props.id, destinatarios: destinatarios.length };
  }
}
