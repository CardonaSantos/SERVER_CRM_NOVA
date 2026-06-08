import { Injectable } from '@nestjs/common';

import { CreateRawWhatsappTemplateDto } from '../dto/create-raw-whatsapp-template.dto';
import { QueryWhatsappTemplateDto } from '../dto/query-whatsapp-template.dto';
import { UpdateWhatsappTemplateDto } from '../dto/update-whatsapp-template.dto';
import { CreateWhatsappTemplateDto } from '../dto/create-whatsapp-template.dto';
import { MetaWhatsappTemplateClientService } from './meta-whatsapp-template-client.service';
import { CreateUtilityImageTemplateDto } from '../dto/create-utility-image-template.dto';
import {
  WhatsappTemplateCategoryDto,
  WhatsappTemplateComponentTypeDto,
  WhatsappTemplateHeaderFormatDto,
} from '../dto/meta-template.enums';

@Injectable()
export class WhatsappTemplateService {
  constructor(
    private readonly metaTemplateClient: MetaWhatsappTemplateClientService,
  ) {}

  create(dto: CreateWhatsappTemplateDto) {
    return this.metaTemplateClient.createTemplate(dto);
  }

  createRaw(dto: CreateRawWhatsappTemplateDto) {
    return this.metaTemplateClient.createRawTemplate(dto);
  }

  createUtilityImageTemplate(dto: CreateUtilityImageTemplateDto) {
    const components: CreateWhatsappTemplateDto['components'] = [];

    if (dto.headerHandle) {
      components.push({
        type: WhatsappTemplateComponentTypeDto.HEADER,
        format: WhatsappTemplateHeaderFormatDto.IMAGE,
        example: {
          header_handle: [dto.headerHandle],
        },
      });
    }

    components.push({
      type: WhatsappTemplateComponentTypeDto.BODY,
      text: dto.bodyText,
      example: {
        body_text: dto.bodyExample,
      },
    });

    if (dto.footerText) {
      components.push({
        type: WhatsappTemplateComponentTypeDto.FOOTER,
        text: dto.footerText,
      });
    }

    const payload: CreateWhatsappTemplateDto = {
      name: dto.name,
      language: dto.language ?? 'es',
      category: WhatsappTemplateCategoryDto.UTILITY,
      components,
    };

    return this.metaTemplateClient.createTemplate(payload);
  }

  findAll(query: QueryWhatsappTemplateDto) {
    return this.metaTemplateClient.listTemplates(query);
  }

  findOneMeta(templateId: string) {
    return this.metaTemplateClient.getTemplateById(templateId);
  }

  updateMeta(templateId: string, dto: UpdateWhatsappTemplateDto) {
    return this.metaTemplateClient.updateTemplate(templateId, dto);
  }

  removeByName(name: string) {
    return this.metaTemplateClient.deleteTemplateByName(name);
  }

  uploadTemplateMediaHandle(file: Express.Multer.File) {
    return this.metaTemplateClient.uploadTemplateMediaHandle(file);
  }
}
