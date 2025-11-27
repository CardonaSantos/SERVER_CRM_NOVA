import { Injectable } from '@nestjs/common';
import { CreateOpenIaDto } from './dto/create-open-ia.dto';
import { UpdateOpenIaDto } from './dto/update-open-ia.dto';
import OpenAI from 'openai';

@Injectable()
export class OpenIaService {
  private client = new OpenAI({
    // apiKey: process.env.OPENAI_API_KEY,
  });
  // OPENAI_API_KEY
  async generateReply(from: string, userMessage: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content:
            'Eres un asistente del CRM de William. Responde en español, de forma breve y clara.',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 200,
    });

    return (
      response.choices[0]?.message?.content ??
      'Lo siento, tuve un problema al procesar tu mensaje.'
    );
  }
}
