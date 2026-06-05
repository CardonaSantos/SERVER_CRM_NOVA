import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { WhatsAppTemplatePayload } from './dto/dto-message-payload';
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
      if (error instanceof AxiosError) {
        this.logger.error(
          `Error enviando a Meta: ${error.message}`,
          error.response?.data,
        );
        throw error;
      }
    }
  }

  async send_message_with_template(payload: WhatsAppTemplatePayload) {
    try {
      this.logger.debug(
        `Payload enviado a Meta:\n${JSON.stringify(payload, null, 2)}`,
      );

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
      if (error instanceof AxiosError) {
        const metaError = error.response?.data;

        this.logger.error(
          `Error enviando a Meta para ${payload.to}. Status: ${error.response?.status}`,
        );

        this.logger.error(
          `Respuesta real de Meta:\n${JSON.stringify(metaError, null, 2)}`,
        );

        throw error;
      }

      this.logger.error(`Error desconocido enviando a Meta`, error);
      throw error;
    }
  }
}
