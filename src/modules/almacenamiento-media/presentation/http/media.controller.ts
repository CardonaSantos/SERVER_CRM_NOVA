import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';

import { EliminarMediaUseCase } from '../../application/use-cases/eliminar-media.use-case';
import { SubirMediaUseCase } from '../../application/use-cases/subir-media.use-case';
import { TipoMedia } from '../../domain/enums/media.enum';
import {
  MetadatosArchivosInvalidosError,
  SinArchivosError,
} from '../../domain/errors/almacenamiento-media.errors';
import { EliminarMediaDto } from '../dto/eliminar-media.dto';
import { SubirMediaLoteDto } from '../dto/subir-media-lote.dto';
import { MediaPresenter } from '../presenters/media.presenter';

type MetadatosArchivo = {
  titulo?: string;
  descripcion?: string;
  etiqueta?: string;
};

@Controller('media')
export class MediaController {
  constructor(
    private readonly subirMedia: SubirMediaUseCase,
    private readonly eliminarMedia: EliminarMediaUseCase,
  ) {}

  /** Sube varios archivos y los registra en `Media`. */
  @UseInterceptors(FilesInterceptor('files'))
  @Post('batch')
  async subirMultiples(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: SubirMediaLoteDto,
    @Actor() actor: ActorHttp,
  ) {
    if (!files?.length) throw new SinArchivosError();

    const items = leerMetadatos(dto.items);

    const resultados = await Promise.all(
      files.map((file, idx) => {
        const meta = items[idx] ?? {};

        return this.subirMedia.execute({
          empresaId: actor.empresaId,
          subidoPorId: actor.usuarioId,
          clienteId: dto.clienteId,
          albumId: dto.albumId,
          publico: dto.publico ?? true,
          categoria: dto.categoria,
          tipo:
            dto.tipo ??
            (file.mimetype.startsWith('video/')
              ? TipoMedia.VIDEO
              : TipoMedia.IMAGEN),
          buffer: file.buffer,
          fileName: file.originalname,
          mime: file.mimetype,
          basePrefix: dto.basePrefix,
          titulo: meta.titulo,
          descripcion: meta.descripcion,
          etiqueta: meta.etiqueta,
        });
      }),
    );

    return MediaPresenter.lote(resultados);
  }

  /** Borra el archivo del almacenamiento y su fila en `Media`. */
  @Post('delete')
  async deleteMedia(@Body() dto: EliminarMediaDto, @Actor() actor: ActorHttp) {
    const resultado = await this.eliminarMedia.execute({
      id: dto.id,
      empresaId: actor.empresaId,
    });

    return MediaPresenter.eliminado(resultado);
  }
}

function leerMetadatos(itemsJson?: string): MetadatosArchivo[] {
  try {
    const items: unknown = JSON.parse(itemsJson ?? '[]');
    return Array.isArray(items) ? (items as MetadatosArchivo[]) : [];
  } catch {
    throw new MetadatosArchivosInvalidosError();
  }
}
