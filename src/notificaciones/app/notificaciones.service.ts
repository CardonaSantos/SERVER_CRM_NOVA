import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Notificacion } from '../entities/notificacione.entity';
import { UpdateNotificacioneDto } from '../dto/update-notificacione.dto';
import {
  NOTIFICATION_REPOSITORY,
  NotificationRepository,
} from '../domain/notification-repository';
import {
  TIEMPO_REAL,
  TiempoRealPort,
} from 'src/common/tiempo-real/tiempo-real.port';
import { CategoriaNotificacion } from '@prisma/client';

/** Legacy: los datos y la audiencia se definen en el módulo `notificacion`. */
export const EVENTO_NOTIFICACION_CREADA = 'notificacion:creada';

@Injectable()
export class NotificacionesService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: NotificationRepository,
    @Inject(TIEMPO_REAL) private readonly tiempoReal: TiempoRealPort,
  ) {}

  async create(
    params: Parameters<typeof Notificacion.create>[0],
  ): Promise<Notificacion> {
    const notificacion = Notificacion.create(params);
    const recordNotification = await this.notificationRepo.save(notificacion);
    this.tiempoReal.emitir(EVENTO_NOTIFICACION_CREADA, recordNotification, {
      todos: true,
    });
    return recordNotification;
  }

  async findAll(): Promise<{
    botsNotifications: Notificacion[];
    notifications: Notificacion[];
  }> {
    const records = await this.notificationRepo.findMany({});

    const botsNotifications = records.filter(
      (not) => not.categoria === CategoriaNotificacion.BOT,
    );
    const notifications = records.filter(
      (not) => not.categoria !== CategoriaNotificacion.BOT,
    );
    const results = {
      botsNotifications: botsNotifications,
      notifications: notifications,
    };
    return results;
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
