import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Inject,
  UploadedFiles,
  Delete,
  Param,
  Query,
  Logger,
  ParseIntPipe,
} from '@nestjs/common';
import { ELIMINAR_MEDIA_USECASE, SUBIR_MEDIA_USECASE } from '../tokens/tokens';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { SubirMediaUseCase } from '../application/use-cases/subir-media.usecase';
import { TipoMedia } from '@prisma/client';
import { EliminarMediaUseCase } from '../application/use-cases/eliminar-media.usecase';
interface DeleteMediaDto {
  id: number;
}

@Controller('media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);
  constructor(
    @Inject(SUBIR_MEDIA_USECASE) private readonly subirMedia: SubirMediaUseCase,

    @Inject(ELIMINAR_MEDIA_USECASE)
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
    const items: {
      titulo?: string;
      descripcion?: string;
      etiqueta?: string;
    }[] = JSON.parse(itemsJson ?? '[]');

    if (!files.length) throw new Error('No hay archivos');

    const results = await Promise.all(
      files.map((file, idx) => {
        const meta = items[idx] ?? {};

        return this.subirMedia.execute({
          empresaId: Number(empresaId),
          clienteId: clienteId ? Number(clienteId) : undefined,
          albumId: albumId ? Number(albumId) : undefined,
          subidoPorId: subidoPorId ? Number(subidoPorId) : undefined,
          publico: publico ? publico === 'true' : true,
          categoria: categoria!,
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

    return { count: results.length, items: results };
  }

  @Post('delete')
  async deleteMedia(
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() body: DeleteMediaDto,
  ) {
    console.log('POST /media/delete');
    console.log('empresaId:', empresaId);
    console.log('body:', body);

    return this.eliminarMedia.execute({
      id: body.id,
      empresaId,
      hardDelete: true,
    });
  }
}
