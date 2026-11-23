import { PartialType } from '@nestjs/swagger';
import { CreateWhatsappCampaignDto } from './create-whatsapp-campaign.dto';

export class UpdateWhatsappCampaignDto extends PartialType(CreateWhatsappCampaignDto) {}
