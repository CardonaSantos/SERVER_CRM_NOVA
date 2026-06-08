import { PartialType } from '@nestjs/mapped-types';
import { CreateWhatsappTemplateDto } from './create-whatsapp-template.dto';

export class UpdateWhatsappTemplateDto extends PartialType(
  CreateWhatsappTemplateDto,
) {}
