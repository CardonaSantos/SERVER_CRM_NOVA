import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { WhatsappCampaignsService } from './whatsapp-campaigns.service';
import { CreateWhatsappCampaignDto } from './dto/create-whatsapp-campaign.dto';
import { UpdateWhatsappCampaignDto } from './dto/update-whatsapp-campaign.dto';
import { SendWhatsappCampaignDto } from 'src/cloud-api-meta/dto/send-whatsapp-campaing.dto';

@Controller('whatsapp-campaigns')
export class WhatsappCampaignsController {
  constructor(
    private readonly whatsappCampaignsService: WhatsappCampaignsService,
  ) {}

  @Post('/send-massive-message')
  sendMassiveMessage(@Body() dto: SendWhatsappCampaignDto) {
    return this.whatsappCampaignsService.send_campaing(dto);
  }
}
