import { PartialType } from '@nestjs/mapped-types';
import { CreateWhatsappApiMetaDto } from './create-whatsapp-api-meta.dto';

export class UpdateWhatsappApiMetaDto extends PartialType(CreateWhatsappApiMetaDto) {}
