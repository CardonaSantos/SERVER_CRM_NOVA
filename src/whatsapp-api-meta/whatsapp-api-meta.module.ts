import { Module } from '@nestjs/common';
import { WhatsappApiMetaService } from './application/whatsapp-api-meta.service';
import { WhatsappApiMetaController } from './presentation/whatsapp-api-meta.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { FireworksIaModule } from 'src/fireworks-ia/fireworks-ia.module';

@Module({
  imports: [
    ConfigModule,
    FireworksIaModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        baseURL: `${config.get('WHATSAPP_API_BASE_URL')}/${config.get('WHATSAPP_PHONE_ID')}`,
        headers: {
          Authorization: `Bearer ${config.get('WHATSAPP_API_TOKEN')}`,
          'Content-Type': 'application/json',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [WhatsappApiMetaController],
  providers: [WhatsappApiMetaService],
  exports: [WhatsappApiMetaService],
})
export class WhatsappApiMetaModule {}
