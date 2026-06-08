import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { WhatsappTemplateService } from '../app/whatsapp-template.service';

import { CreateWhatsappTemplateDto } from '../dto/create-whatsapp-template.dto';
import { CreateRawWhatsappTemplateDto } from '../dto/create-raw-whatsapp-template.dto';
import { CreateUtilityImageTemplateDto } from '../dto/create-utility-image-template.dto';
import { QueryWhatsappTemplateDto } from '../dto/query-whatsapp-template.dto';
import { UpdateWhatsappTemplateDto } from '../dto/update-whatsapp-template.dto';

@Controller('whatsapp-template')
export class WhatsappTemplateController {
  constructor(
    private readonly whatsappTemplateService: WhatsappTemplateService,
  ) {}

  /**
   * Crear plantilla normal en Meta.
   *
   * Sirve para:
   * - UTILITY
   * - MARKETING
   * - AUTHENTICATION
   *
   * Ejemplo:
   * POST /whatsapp-template
   */
  @Post()
  create(@Body() dto: CreateWhatsappTemplateDto) {
    return this.whatsappTemplateService.create(dto);
  }

  /**
   * Crear plantilla avanzada usando payload casi directo de Meta.
   *
   * Sirve para:
   * - carousel
   * - plantillas con estructuras especiales
   * - botones más complejos
   * - payloads que no quieras tipar rígidamente todavía
   *
   * Ejemplo:
   * POST /whatsapp-template/raw
   */
  @Post('raw')
  createRaw(@Body() dto: CreateRawWhatsappTemplateDto) {
    return this.whatsappTemplateService.createRaw(dto);
  }

  /**
   * Crear plantilla UTILITY con imagen opcional.
   *
   * Flujo:
   * 1. Primero subes imagen en /media-handle
   * 2. Recibes headerHandle
   * 3. Mandas ese headerHandle aquí
   *
   * Ejemplo:
   * POST /whatsapp-template/utility/image
   */
  @Post('utility/image')
  createUtilityImageTemplate(@Body() dto: CreateUtilityImageTemplateDto) {
    return this.whatsappTemplateService.createUtilityImageTemplate(dto);
  }

  /**
   * Subir imagen a Meta para obtener headerHandle.
   *
   * Este handle se usa en plantillas con HEADER IMAGE.
   *
   * FormData:
   * file: imagen.jpg
   *
   * Ejemplo:
   * POST /whatsapp-template/media-handle
   */
  @Post('media-handle')
  @UseInterceptors(FileInterceptor('file'))
  uploadTemplateMediaHandle(@UploadedFile() file: Express.Multer.File) {
    return this.whatsappTemplateService.uploadTemplateMediaHandle(file);
  }

  /**
   * Listar plantillas directamente desde Meta.
   *
   * Query params soportados:
   * - name
   * - language
   * - category
   * - status
   * - limit
   * - after
   *
   * Ejemplos:
   * GET /whatsapp-template
   * GET /whatsapp-template?category=UTILITY
   * GET /whatsapp-template?status=APPROVED
   * GET /whatsapp-template?category=UTILITY&status=PENDING
   */
  @Get()
  findAll(@Query() query: QueryWhatsappTemplateDto) {
    return this.whatsappTemplateService.findAll(query);
  }

  /**
   * Obtener una plantilla específica desde Meta usando el ID de plantilla.
   *
   * Ejemplo:
   * GET /whatsapp-template/meta/123456789
   */
  @Get('meta/:templateId')
  findOneMeta(@Param('templateId') templateId: string) {
    return this.whatsappTemplateService.findOneMeta(templateId);
  }

  /**
   * Actualizar plantilla en Meta.
   *
   * Ojo:
   * Meta no permite editar cualquier campo en cualquier estado.
   * Lo más normal es actualizar components/category según reglas de Meta.
   *
   * Ejemplo:
   * PATCH /whatsapp-template/meta/123456789
   */
  @Patch('meta/:templateId')
  updateMeta(
    @Param('templateId') templateId: string,
    @Body() dto: UpdateWhatsappTemplateDto,
  ) {
    return this.whatsappTemplateService.updateMeta(templateId, dto);
  }

  /**
   * Eliminar plantilla en Meta por nombre.
   *
   * Meta normalmente borra templates por name.
   *
   * Ejemplo:
   * DELETE /whatsapp-template/meta/name/recordatorio_pago_servicio
   */
  @Delete('meta/name/:name')
  removeByName(@Param('name') name: string) {
    return this.whatsappTemplateService.removeByName(name);
  }
}
