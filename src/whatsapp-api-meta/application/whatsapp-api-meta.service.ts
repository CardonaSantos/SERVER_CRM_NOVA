import { Injectable, Logger } from '@nestjs/common';
import { CreateWhatsappApiMetaDto } from '../dto/create-whatsapp-api-meta.dto';
import { UpdateWhatsappApiMetaDto } from '../dto/update-whatsapp-api-meta.dto';
import { HttpService } from '@nestjs/axios';
import { throwFatalError } from 'src/Utils/CommonFatalError';

@Injectable()
export class WhatsappApiMetaService {
  private readonly logger = new Logger(WhatsappApiMetaService.name);
  constructor(private readonly http: HttpService) {}

  async sendText(to: string, text: string) {
    try {
      const response = await this.http.axiosRef.post('/messages', {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      });

      this.logger.log(
        `Mensaje enviado a ${to}. Status: ${response.status}`,
        WhatsappApiMetaService.name,
      );
      this.logger.debug(
        JSON.stringify(response.data),
        WhatsappApiMetaService.name,
      );

      return { ok: true };
    } catch (error) {
      throwFatalError(error, this.logger, 'WhatsappApiMetaService -sendText');
    }
  }
}
