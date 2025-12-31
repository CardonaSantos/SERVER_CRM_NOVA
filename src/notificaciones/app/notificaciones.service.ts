import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { Notificacion } from '../entities/notificacione.entity';
import { UpdateNotificacioneDto } from '../dto/update-notificacione.dto';
import {
  NOTIFICATION_REPOSITORY,
  NotificationRepository,
} from '../domain/notification-repository';
import { WebSocketServices } from 'src/web-sockets/websocket.service';

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: NotificationRepository,
    private readonly wb: WebSocketServices,
  ) {}

  async create(
    params: Parameters<typeof Notificacion.create>[0],
  ): Promise<Notificacion> {
    const notificacion = Notificacion.create(params);
    const recordNotification = await this.notificationRepo.save(notificacion);
    await this.wb.emitSystemNotification(
      notificacion.empresaId,
      recordNotification,
    );
    return recordNotification;
  }

  async findAll(): Promise<Notificacion[]> {
    const records = await this.notificationRepo.findMany();

    // const recor
    return this.notificationRepo.findMany();
  }

  async findOne(id: number): Promise<Notificacion> {
    const noti = await this.notificationRepo.findById(id);
    if (!noti) throw new NotFoundException(`Notificación ${id} no encontrada`);
    return noti;
  }

  async update(id: number, dto: UpdateNotificacioneDto): Promise<Notificacion> {
    const notificacion = await this.findOne(id);

    notificacion.update({
      titulo: dto.titulo,
      mensaje: dto.mensaje,
      categoria: dto.categoria,
      severidad: dto.severidad,
      url: dto.url,
      route: dto.route,
      actionLabel: dto.actionLabel,
      visibleDesde: dto.visibleDesde,
      expiraEn: dto.expiraEn,
      programadaEn: dto.programadaEn,
    });

    return this.notificationRepo.save(notificacion);
  }

  async remove(id: number): Promise<void> {
    const success = await this.notificationRepo.deleteById(id);
    if (!success)
      throw new NotFoundException(`Notificación ${id} no encontrada`);
  }
}
