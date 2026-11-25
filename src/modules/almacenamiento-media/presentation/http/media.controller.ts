import {
  Body,
  Controller,
  ParseIntPipe,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { IsInt, IsPositive } from 'class-validator';

import { EliminarMediaUseCase } from '../../application/use-cases/eliminar-media.use-case';
import { SubirMediaUseCase } from '../../application/use-cases/subir-media.use-case';
import { CategoriaMedia, TipoMedia } from '../../domain/enums/media.enum';
import {
  MetadatosArchivosInvalidosError,
  SinArchivosError,
} from '../../domain/errors/almacenamiento-media.errors';
import { MediaPresenter } from '../presenters/media.presenter';

/**
 * Era una interfaz: el ValidationPipe no puede validar interfaces, así que
 * este borrado (hard delete en DigitalOcean) aceptaba cualquier body.
 */
class DeleteMediaDto {
  @IsInt()
  @IsPositive()
  id: number;
}

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

  @UseInterceptors(FilesInterceptor('files'))
  @Post('batch')
  async subirMultiples(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('empresaId') empresaId: string,
    @Body('clienteId') clienteId?: string,
    @Body('albumId') albumId?: string,
    @Body('subidoPorId') subidoPorId?: string,
    @Body('publico') publico?: string,
    @Body('categoria') categoria?: string,
    @Body('tipo') tipo?: TipoMedia,
    @Body('basePrefix') basePrefix?: string,
    @Body('items') itemsJson?: string,
  ) {
    if (!files?.length) throw new SinArchivosError();

    const items = leerMetadatos(itemsJson);

    const resultados = await Promise.all(
      files.map((file, idx) => {
        const meta = items[idx] ?? {};

        return this.subirMedia.execute({
          empresaId: Number(empresaId),
          clienteId: clienteId ? Number(clienteId) : undefined,
          albumId: albumId ? Number(albumId) : undefined,
          subidoPorId: subidoPorId ? Number(subidoPorId) : undefined,
          publico: publico ? publico === 'true' : true,
          categoria: categoria as CategoriaMedia,
          tipo:
            tipo ??
            (file.mimetype.startsWith('video/')
              ? TipoMedia.VIDEO
              : TipoMedia.IMAGEN),
          buffer: file.buffer,
          fileName: file.originalname,
          mime: file.mimetype,
          basePrefix,
          titulo: meta.titulo,
          descripcion: meta.descripcion,
          etiqueta: meta.etiqueta,
        });
      }),
    );

    return MediaPresenter.lote(resultados);
  }

  @Post('delete')
  async deleteMedia(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() body: DeleteMediaDto,
  ) {
    const resultado = await this.eliminarMedia.execute({
      id: body.id,
      empresaId,
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
