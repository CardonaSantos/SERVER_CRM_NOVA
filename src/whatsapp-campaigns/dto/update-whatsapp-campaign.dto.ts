import { PartialType } from '@nestjs/mapped-types';
import { CreateWhatsappCampaignDto } from './create-whatsapp-campaign.dto';

export class UpdateWhatsappCampaignDto extends PartialType(CreateWhatsappCampaignDto) {}
