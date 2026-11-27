import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { CrearPlantillaImagenUseCase } from '../../application/use-cases/crear-plantilla-imagen.use-case';
import { CrearPlantillaUseCase } from '../../application/use-cases/crear-plantilla.use-case';
import { EliminarPlantillaUseCase } from '../../application/use-cases/eliminar-plantilla.use-case';
import { ListarPlantillasUseCase } from '../../application/use-cases/listar-plantillas.use-case';
import {
  SubirImagenPlantillaUseCase,
  TAMANO_MAXIMO_IMAGEN,
} from '../../application/use-cases/subir-imagen-plantilla.use-case';
import { CrearPlantillaImagenDto } from '../dto/crear-plantilla-imagen.dto';
import { CrearPlantillaDto } from '../dto/crear-plantilla.dto';
import { ListarPlantillasQueryDto } from '../dto/listar-plantillas-query.dto';
import { PlantillaPresenter } from '../presenters/plantilla.presenter';

const IDIOMA_POR_DEFECTO = 'es';

@ApiTags('whatsapp-template')
@Controller('whatsapp-template')
export class PlantillaWhatsappController {
  constructor(
    private readonly listarPlantillas: ListarPlantillasUseCase,
    private readonly crearPlantilla: CrearPlantillaUseCase,
    private readonly crearPlantillaImagen: CrearPlantillaImagenUseCase,
    private readonly subirImagen: SubirImagenPlantillaUseCase,
    private readonly eliminarPlantilla: EliminarPlantillaUseCase,
  ) {}

  /** Plantillas en WhatsApp. */
  @Get()
  async listar(@Query() query: ListarPlantillasQueryDto) {
    return PlantillaPresenter.listado(
      await this.listarPlantillas.execute({
        name: query.name,
        language: query.language,
        category: query.category,
        status: query.status,
        limit: query.limit,
        after: query.after,
      }),
    );
  }

  /** Envía una plantilla a revisión. */
  @Post()
  crear(@Body() dto: CrearPlantillaDto) {
    return this.crearPlantilla.execute({
      name: dto.name,
      language: dto.language ?? IDIOMA_POR_DEFECTO,
      category: dto.category,
      components: dto.components,
    });
  }

  /** Plantilla de servicio con imagen opcional. */
  @Post('utility/image')
  crearConImagen(@Body() dto: CrearPlantillaImagenDto) {
    return this.crearPlantillaImagen.execute({
      name: dto.name,
      language: dto.language ?? IDIOMA_POR_DEFECTO,
      headerHandle: dto.headerHandle,
      bodyText: dto.bodyText,
      bodyExample: dto.bodyExample,
      footerText: dto.footerText,
    });
  }

  /** Sube la imagen de ejemplo de un encabezado (campo `file`). */
  @Post('media-handle')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: TAMANO_MAXIMO_IMAGEN } }),
  )
  subir(@UploadedFile() file?: Express.Multer.File) {
    return this.subirImagen.execute(
      file
        ? {
            nombre: file.originalname,
            mimeType: file.mimetype,
            tamano: file.size,
            contenido: file.buffer,
          }
        : null,
    );
  }

  /** Borra la plantilla en todos sus idiomas. */
  @Delete('meta/name/:name')
  async eliminar(@Param('name') name: string, @Actor() actor: ActorHttp) {
    const { nombre } = await this.eliminarPlantilla.execute({
      usuarioId: actor.usuarioId,
      nombre: name,
    });
    return { name: nombre, eliminada: true };
  }
}
