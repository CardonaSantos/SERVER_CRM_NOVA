import { Module } from '@nestjs/common';
import { WhatsappTemplateController } from './presentation/whatsapp-template.controller';
import { WhatsappTemplateService } from './app/whatsapp-template.service';
import { MetaWhatsappTemplateClientService } from './app/meta-whatsapp-template-client.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [WhatsappTemplateController],
  providers: [WhatsappTemplateService, MetaWhatsappTemplateClientService],
})
export class WhatsappTemplateModule {}
