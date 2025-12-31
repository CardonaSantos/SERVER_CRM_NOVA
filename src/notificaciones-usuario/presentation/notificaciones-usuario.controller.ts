import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificacionesUsuarioService } from '../app/notificaciones-usuario.service'; // Ajusta la ruta si es necesario
import { CreateNotificacionUsuarioDto } from '../dto/create-notificaciones-usuario.dto';

@Controller('notificaciones-usuario')
export class NotificacionesUsuarioController {
  constructor(
    private readonly notificacionesUsuarioService: NotificacionesUsuarioService,
  ) {}

  /**
   * Asigna una notificación a un usuario
   * POST /notificaciones-usuario
   */
  @Post()
  create(@Body() createDto: CreateNotificacionUsuarioDto) {
    return this.notificacionesUsuarioService.crearAsignacion(
      createDto.usuarioId,
      createDto.notificacionId,
    );
  }

  /**
   * Obtiene todas las notificaciones de un usuario específico
   * GET /notificaciones-usuario/usuario/:usuarioId
   */
  @Get('usuario/:usuarioId')
  findAllByUser(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.notificacionesUsuarioService.obtenerPorUsuario(usuarioId);
  }

  /**
   * Obtiene SOLO las pendientes (no leídas) de un usuario específico
   * GET /notificaciones-usuario/usuario/:usuarioId/pendientes
   * CAMBIO: Antes era global, ahora filtramos por usuario.
   */
  @Get('usuario/:usuarioId/pendientes')
  findPending(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.notificacionesUsuarioService.obtenerPendientes(usuarioId);
  }

  /**
   * Obtiene una asignación específica por su ID único (ID de la tabla intermedia)
   * GET /notificaciones-usuario/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.notificacionesUsuarioService.obtenerPorId(id);
  }

  /**
   * Marca una notificación como leída
   * PATCH /notificaciones-usuario/:id/leida
   */
  @Patch(':id/leida')
  markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificacionesUsuarioService.marcarComoLeida(id);
  }

  /**
   * Elimina una notificación (Soft Delete)
   * DELETE /notificaciones-usuario/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Devuelve 204 si todo sale bien (sin cuerpo)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.notificacionesUsuarioService.eliminar(id);
  }
}
