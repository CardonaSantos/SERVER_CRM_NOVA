import { Module } from '@nestjs/common';
import { WhatsappCampaignsService } from './whatsapp-campaigns.service';
import { WhatsappCampaignsController } from './whatsapp-campaigns.controller';
import { CloudApiMetaModule } from 'src/cloud-api-meta/cloud-api-meta.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [WhatsappCampaignsController],
  providers: [WhatsappCampaignsService],
  imports: [CloudApiMetaModule, HttpModule],
})
export class WhatsappCampaignsModule {}
