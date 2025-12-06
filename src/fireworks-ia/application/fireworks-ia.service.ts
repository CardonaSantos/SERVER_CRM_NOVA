import { Inject, Injectable, Logger } from '@nestjs/common';
import { FIREWORKS_CLIENT } from '../infraestructure/fireworks-ia.client';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FireworksIaService {
  private readonly chatModel: string;
  private readonly embeddingModel: string;

  private readonly logger = new Logger(FireworksIaService.name);
  constructor(
    @Inject(FIREWORKS_CLIENT) private readonly fireworks: OpenAI,
    private readonly config: ConfigService,
  ) {
    this.chatModel =
      this.config.get<string>('FIREWORKS_MODEL') ??
      'accounts/fireworks/models/gpt-oss-120b';

    this.embeddingModel =
      this.config.get<string>('FIREWORKS_EMBEDDINGS_MODEL') ??
      'fireworks/qwen3-embedding-8b'; // mejor con el prefijo "fireworks/"

    this.logger.log(
      `Modelos Fireworks cargados: chat=${this.chatModel}, embeddings=${this.embeddingModel}`,
    );
  }

  /**
   * CEREBRO DEL BOT RESPONDE, FIREWORKS
   * @param message
   * @returns
   */
  async simpleReply(message: string) {
    const completion = await this.fireworks.chat.completions.create({
      model: this.chatModel,
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

  /**
   * Genera embedding de un solo texto
   * @param text
   */
  async embedText(text: string): Promise<number[]> {
    const response = await this.fireworks.embeddings.create({
      model: this.embeddingModel,
      input: text,
    });

    const embedding = response.data[0].embedding as number[];
    this.logger.debug(
      `Embedding generado. Dimensión: ${embedding.length} tokens usados: ${response.usage?.prompt_tokens}`,
    );
    return embedding;
  }

  /**
   * Genera embeddings para varios textos hasta 8 por reques
   *
   * @param texts
   * @returns
   */
  async embedMany(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    // Fireworks limita a 8 inputs por llamada para algunos clientes
    const response = await this.fireworks.embeddings.create({
      model: this.embeddingModel,
      input: texts,
    });
    return response.data.map((data) => data.embedding as number[]);
  }
}
