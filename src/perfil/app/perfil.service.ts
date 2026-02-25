import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  ELIMINAR_MEDIA_USECASE,
  UPLOAD_FILE_USECASE,
} from 'src/modules/digital-ocean-media/tokens/tokens';

import { UploadFileUseCase } from 'src/modules/digital-ocean-media/application/use-cases/upload-file.usecase';
import { EliminarMediaUseCase } from 'src/modules/digital-ocean-media/application/use-cases/eliminar-media.usecase';
import { EliminarMediaCommand } from 'src/modules/digital-ocean-media/dto/eliminar-media.dto';

import {
  PERFIL_REPOSITORY,
  PerfilRepository,
} from '../domain/perfil.repository';

import { Perfil } from '../entities/perfil.entity';
import { PerfilMedia } from '../entities/perfil.entity';
import { UpsertPerfilDto } from '../dto/upser.dto';

@Injectable()
export class PerfilService {
  constructor(
    @Inject(ELIMINAR_MEDIA_USECASE)
    private readonly deleteFile: EliminarMediaUseCase,

    @Inject(UPLOAD_FILE_USECASE)
    private readonly uploadFile: UploadFileUseCase,

    @Inject(PERFIL_REPOSITORY)
    private readonly perfilRepo: PerfilRepository,
  ) {}

  async upsertPerfil(
    usuarioId: number,
    dto: UpsertPerfilDto,
    avatar?: Express.Multer.File,
    portada?: Express.Multer.File,
  ) {
    let perfil = await this.perfilRepo.findByUsuarioId(usuarioId);

    if (!perfil) {
      perfil = Perfil.crear({
        usuarioId,
        bio: dto.bio,
        telefono: dto.telefono,
        notificarWhatsApp: dto.notificarWhatsApp,
        notificarPush: dto.notificarPush,
        notificarSonido: dto.notificarSonido,
      });

      perfil = await this.perfilRepo.save(perfil);
    } else {
      perfil.actualizarDatos(dto);
      perfil = await this.perfilRepo.update(perfil);
    }

    if (avatar) {
      perfil = await this.handleAvatarUpload(perfil, avatar);
    }

    if (portada) {
      perfil = await this.handlePortadaUpload(perfil, portada);
    }

    return perfil;
  }

  // =========================
  // AVATAR
  // =========================

  private async handleAvatarUpload(
    perfil: Perfil,
    file: Express.Multer.File,
  ): Promise<Perfil> {
    const currentAvatar = perfil.getAvatar();

    if (currentAvatar) {
      const cmd: EliminarMediaCommand = {
        empresaId: 1,
        id: parseInt(currentAvatar.getKey()), // tu repo debe mapear id↔key si usas media table
        hardDelete: true,
      };

      await this.safeDeleteMedia(
        currentAvatar.getBucket(),
        currentAvatar.getKey(),
      );
    }

    const uploaded = await this.uploadFile.execute({
      buffer: file.buffer,
      mime: file.mimetype,
      empresaId: 1,
      tipo: 'perfil-avatar',
      basePrefix: 'usuarios',
    });

    const media = PerfilMedia.crear({
      url: uploaded.cdnUrl,
      key: uploaded.key,
      bucket: uploaded.bucket,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
    });

    perfil.actualizarAvatar(media);

    return await this.perfilRepo.update(perfil);
  }

  // =========================
  // PORTADA
  // =========================

  private async handlePortadaUpload(
    perfil: Perfil,
    file: Express.Multer.File,
  ): Promise<Perfil> {
    const currentPortada = perfil.getPortada();

    if (currentPortada) {
      await this.safeDeleteMedia(
        currentPortada.getBucket(),
        currentPortada.getKey(),
      );
    }

    const uploaded = await this.uploadFile.execute({
      buffer: file.buffer,
      mime: file.mimetype,
      empresaId: 1,
      tipo: 'perfil-portada',
      basePrefix: 'usuarios',
    });

    const media = PerfilMedia.crear({
      url: uploaded.cdnUrl,
      key: uploaded.key,
      bucket: uploaded.bucket,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
    });

    perfil.actualizarPortada(media);

    return await this.perfilRepo.update(perfil);
  }

  // =========================
  // DELETE SEGURO
  // =========================

  private async safeDeleteMedia(bucket: string, key: string) {
    try {
      await this.uploadFile['storage'].delete({
        bucket,
        key,
      });
    } catch (error) {
      // No bloqueamos flujo si falla DO
      console.error('Error eliminando archivo anterior:', error);
    }
  }

  // =========================
  // ELIMINAR AVATAR
  // =========================

  async eliminarAvatar(usuarioId: number) {
    const perfil = await this.perfilRepo.findByUsuarioId(usuarioId);
    if (!perfil || !perfil.getAvatar()) return;

    const avatar = perfil.getAvatar();

    await this.safeDeleteMedia(avatar.getBucket(), avatar.getKey());

    perfil.eliminarAvatar();

    return await this.perfilRepo.update(perfil);
  }

  // =========================
  // ELIMINAR PORTADA
  // =========================

  async eliminarPortada(usuarioId: number) {
    const perfil = await this.perfilRepo.findByUsuarioId(usuarioId);
    if (!perfil || !perfil.getPortada()) return;

    const portada = perfil.getPortada();

    await this.safeDeleteMedia(portada.getBucket(), portada.getKey());

    perfil.eliminarPortada();

    return await this.perfilRepo.update(perfil);
  }

  // =========================
  // OBTENER PERFIL COMBINADO
  // =========================

  async obtenerPerfilPorUsuarioId(usuarioId: number) {
    const perfil = await this.perfilRepo.findByUsuarioId(usuarioId);

    if (!perfil) {
      return null; // Si el usuario no ha configurado su perfil aún
    }

    const avatar = perfil.getAvatar();
    const portada = perfil.getPortada();

    return {
      bio: perfil.getBio() ?? '',
      telefono: perfil.getTelefono() ?? '',
      notificarWhatsApp: perfil.getNotificarWhatsApp(),
      notificarPush: perfil.getNotificarPush(),
      notificarSonido: perfil.getNotificarSonido(),
      // Mapeamos solo la URL para el frontend si el media existe
      avatar: avatar ? { url: avatar.getUrl() } : null,
      portada: portada ? { url: portada.getUrl() } : null,
      creadoEn: perfil.getCreadoEn(),
      actualizadoEn: perfil.getActualizadoEn(),
    };
  }
}
