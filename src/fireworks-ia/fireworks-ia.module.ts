import { Module } from '@nestjs/common';
import { FireworksIaService } from './application/fireworks-ia.service';
import { FireworksIaController } from './presentation/fireworks-ia.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FIREWORKS_CLIENT } from './infraestructure/fireworks-ia.client';
import OpenAI from 'openai';

@Module({
  imports: [ConfigModule],
  controllers: [FireworksIaController],
  providers: [
    {
      provide: FIREWORKS_CLIENT,
      useFactory: (config: ConfigService) => {
        return new OpenAI({
          apiKey: config.get('FIREWORKS_API_KEY'),
          baseURL:
            config.get('FIREWORKS_BASE_URL') ??
            'https://api.fireworks.ai/inference/v1',
        });
      },
      inject: [ConfigService],
    },
    FireworksIaService,
  ],
  exports: [FireworksIaService],
})
export class FireworksIaModule {}
