import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsappApiMetaController } from './presentation/whatsapp-api-meta.controller';

@Module({
  imports: [ConfigModule],
  controllers: [WhatsappApiMetaController],
})
export class WhatsappApiMetaModule {}
