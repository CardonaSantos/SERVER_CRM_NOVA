import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppTemplatePayload } from './interfaces/cloud-api-meta.interface';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class CloudApiMetaService {
  private readonly logger = new Logger(CloudApiMetaService.name);
  private readonly apiUrl: string;
  private readonly apiToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService, // Inyectamos para poder enviar
  ) {
    const phoneId = this.configService.get<string>('WHATSAPP_PHONE_ID');
    this.apiUrl = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
    this.apiToken = this.configService.get<string>('WHATSAPP_API_TOKEN');
  }

  /**
   * Genera el JSON listo para enviar a Meta
   */
  crearPayloadTicket(
    telefono: string,
    templateNombre: string,
    variables: string[], // Array simple de strings
  ): WhatsAppTemplatePayload {
    return {
      messaging_product: 'whatsapp',
      to: telefono,
      type: 'template',
      template: {
        name: templateNombre,
        language: { code: 'es' },
        components: [
          {
            type: 'body',
            // Mapeo limpio y directo
            parameters: variables.map((variable) => ({
              type: 'text',
              text: String(variable), // Aseguramos que sea string
            })),
          },
        ],
      },
    };
  }

  /**
   * Método genérico para disparar el envío
   */
  async enviarMensaje(payload: WhatsAppTemplatePayload) {
    try {
      const response = await lastValueFrom(
        this.httpService.post(this.apiUrl, payload, {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );
      this.logger.log(`Mensaje enviado a ${payload.to}: ${response.status}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error enviando a Meta: ${error.message}`,
        error.response?.data,
      );
      throw error;
    }
  }
}
