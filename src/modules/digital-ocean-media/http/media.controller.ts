// src/modules/media/interface/http/media.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Inject,
} from '@nestjs/common';
import { SUBIR_MEDIA_USECASE } from '../tokens/tokens';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubirMediaUseCase } from '../application/use-cases/subir-media.usecase';
import { TipoMedia } from '@prisma/client';

@Controller('media')
export class MediaController {
  constructor(
    @Inject(SUBIR_MEDIA_USECASE) private readonly subirMedia: SubirMediaUseCase,
  ) {}

  // interface/http/media.controller.ts (fragmento)
  @UseInterceptors(FileInterceptor('file'))
  @Post()
  async subir(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      empresaId: number;
      clienteId?: number;
      albumId?: number;
      subidoPorId?: number;
      publico?: string;
      categoria: string;
      tipo: TipoMedia; // 'IMAGEN' | 'VIDEO' | ...
      titulo?: string;
      descripcion?: string;
      etiqueta?: string;
      basePrefix?: string; // 👈 "crm" | "pos" | "crm/clientes/imagenes"
    },
  ) {
    const result = await this.subirMedia.execute({
      empresaId: Number(body.empresaId),
      clienteId: body.clienteId ? Number(body.clienteId) : undefined,
      albumId: body.albumId ? Number(body.albumId) : undefined,
      subidoPorId: body.subidoPorId ? Number(body.subidoPorId) : undefined,
      publico: body.publico ? body.publico === 'true' : true,
      categoria: body.categoria,
      tipo: body.tipo,
      buffer: file.buffer,
      fileName: file.originalname,
      mime: file.mimetype,
      titulo: body.titulo,
      descripcion: body.descripcion,
      etiqueta: body.etiqueta,
      basePrefix: body.basePrefix, // 👈 pásalo
    });

    return result;
  }
}
