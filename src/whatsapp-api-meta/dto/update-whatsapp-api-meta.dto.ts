import { PartialType } from '@nestjs/swagger';
import { CreateWhatsappApiMetaDto } from './create-whatsapp-api-meta.dto';

export class UpdateWhatsappApiMetaDto extends PartialType(CreateWhatsappApiMetaDto) {}
