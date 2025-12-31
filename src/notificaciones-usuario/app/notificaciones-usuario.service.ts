import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificacionUsuario } from '../entities/notificaciones-usuario.entity';
import {
  NOTIFICACION_USUARIO,
  NotificationUserRepository,
} from '../domain/notificaciones-usuario-repository';

@Injectable()
export class NotificacionesUsuarioService {
  private readonly logger = new Logger(NotificacionesUsuarioService.name);

  constructor(
    @Inject(NOTIFICACION_USUARIO)
    private readonly repo: NotificationUserRepository,
  ) {}

  async crearAsignacion(
    usuarioId: number,
    notificacionId: number,
  ): Promise<NotificacionUsuario> {
    const nuevaAsignacion = NotificacionUsuario.create({
      usuarioId,
      notificacionId,
    });
    return await this.repo.save(nuevaAsignacion);
  }

  async obtenerPorUsuario(usuarioId: number): Promise<NotificacionUsuario[]> {
    return await this.repo.findByUsuarioId(usuarioId);
  }

  async obtenerPorId(id: number): Promise<NotificacionUsuario> {
    const notificacion = await this.repo.findById(id);
    if (!notificacion) {
      throw new NotFoundException(`Notificación ${id} no encontrada`);
    }
    return notificacion;
  }

  async obtenerPendientes(usuarioId: number): Promise<NotificacionUsuario[]> {
    // Agregué usuarioId porque generalmente quieres las pendientes DE UN USUARIO, no de todo el sistema
    return await this.repo.findByEstado(usuarioId, false);
  }

  async marcarComoLeida(id: number): Promise<NotificacionUsuario> {
    // 1. Load
    const notificacion = await this.obtenerPorId(id);

    // 2. Mutate (Usamos la lógica de dominio)
    notificacion.marcarLeida();

    // 3. Save
    return await this.repo.save(notificacion);
  }

  async eliminar(id: number): Promise<void> {
    const exito = await this.repo.deleteById(id);
    if (!exito) {
      throw new NotFoundException(`No se pudo eliminar la notificación ${id}`);
    }
  }
}
