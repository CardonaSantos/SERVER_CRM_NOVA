import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateFireworksIaDto } from '../dto/create-fireworks-ia.dto';
import { UpdateFireworksIaDto } from '../dto/update-fireworks-ia.dto';
import { FIREWORKS_CLIENT } from '../infraestructure/fireworks-ia.client';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FireworksIaService {
  private readonly model: string;
  private readonly logger = new Logger(FireworksIaService.name);
  constructor(
    @Inject(FIREWORKS_CLIENT) private readonly fireworks: OpenAI,
    private readonly config: ConfigService,
  ) {
    this.model = this.config.get<string>('FIREWORKS_MODEL');
  }

  async simpleReply(message: string) {
    const completion = await this.fireworks.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            'Eres el asistente de soporte al cliente, y agente del CRM de Nova Sistemas S.A. Responde siempre, alegre, amable y creativo',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      max_completion_tokens: 500,
      temperature: 0.2,
    });
    return completion.choices[0].message.content ?? '';
  }
}
