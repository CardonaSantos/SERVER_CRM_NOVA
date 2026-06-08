import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { CloudApiMetaService } from 'src/cloud-api-meta/cloud-api-meta.service';
import { WhatsAppTemplatePayload } from 'src/cloud-api-meta/dto/dto-message-payload';
import { SendWhatsappCampaignDto } from 'src/cloud-api-meta/dto/send-whatsapp-campaing.dto';

@Injectable()
export class WhatsappCampaignsService {
  private readonly logger = new Logger(WhatsappCampaignsService.name);

  constructor(private readonly metaApi: CloudApiMetaService) {}

  async send_campaing(dto: SendWhatsappCampaignDto) {
    if (!dto.templateName?.trim()) {
      throw new BadRequestException('La plantilla es requerida');
    }

    if (!dto.templateLanguage?.trim()) {
      throw new BadRequestException('El idioma de la plantilla es requerido');
    }

    if (!Array.isArray(dto.recipients) || dto.recipients.length === 0) {
      throw new BadRequestException('Debe enviar al menos un destinatario');
    }

    const validRecipients = dto.recipients
      .map((recipient) => ({
        ...recipient,
        phone: this.normalizeGuatemalaPhone(recipient.phone),
      }))
      .filter((recipient) => this.isValidGuatemalaPhone(recipient.phone));

    if (validRecipients.length === 0) {
      throw new BadRequestException('No hay destinatarios con teléfono válido');
    }

    const results = [];

    for (const recipient of validRecipients) {
      const components = this.buildTemplateComponents(dto);

      const metaPayload: WhatsAppTemplatePayload = {
        messaging_product: 'whatsapp',
        to: recipient.phone,
        type: 'template',
        template: {
          name: dto.templateName,
          language: {
            code: dto.templateLanguage,
          },
          ...(components ? { components } : {}),
        },
      };

      try {
        const response =
          await this.metaApi.send_message_with_template(metaPayload);

        results.push({
          customerId: recipient.customerId,
          phone: recipient.phone,
          fullName: recipient.fullName,
          success: true,
          response,
        });
      } catch (error) {
        this.logger.error(
          `Error enviando campaña a cliente ${recipient.customerId} - ${recipient.phone}`,
          error,
        );

        results.push({
          customerId: recipient.customerId,
          phone: recipient.phone,
          fullName: recipient.fullName,
          success: false,
          error: this.getErrorMessage(error),
        });
      }
    }

    const sent = results.filter((item) => item.success).length;
    const failed = results.filter((item) => !item.success).length;

    return {
      ok: failed === 0,
      templateName: dto.templateName,
      templateLanguage: dto.templateLanguage,
      templateCategory: dto.templateCategory,
      requestedRecipients: dto.recipients.length,
      validRecipients: validRecipients.length,
      sent,
      failed,
      estimatedCost: dto.estimatedCost,
      results,
    };
  }

  private normalizeGuatemalaPhone(phone: string): string {
    const cleaned = String(phone ?? '').replace(/\D/g, '');

    if (cleaned.length === 8) {
      return `502${cleaned}`;
    }

    if (cleaned.length === 11 && cleaned.startsWith('502')) {
      return cleaned;
    }

    return cleaned;
  }

  private isValidGuatemalaPhone(phone: string): boolean {
    return /^502\d{8}$/.test(phone);
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return 'Error desconocido enviando mensaje';
  }
  private buildTemplateComponents(dto: SendWhatsappCampaignDto) {
    const components: WhatsAppTemplatePayload['template']['components'] = [];

    if (dto.headerImageUrl?.trim()) {
      components.push({
        type: 'header',
        parameters: [
          {
            type: 'image',
            image: {
              link: dto.headerImageUrl.trim(),
            },
          },
        ],
      });
    }

    return components.length > 0 ? components : undefined;
  }
}
