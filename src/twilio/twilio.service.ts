import { Injectable } from '@nestjs/common';
import { CreateTwilioDto } from './dto/create-twilio.dto';
import * as Twilio from 'twilio';

@Injectable()
export class TwilioService {
  private client: Twilio.Twilio;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.client = Twilio(accountSid, authToken);
  }

  async sendWhatsAppTemplate(
    to: string,
    templateSid: string,
    variables: Record<string, any>,
  ) {
    try {
      return await this.client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to,
        contentSid: templateSid,
        contentVariables: JSON.stringify(variables),
      });
    } catch (error) {
      console.log('Error al enviar mensaje con Twilio:', error);
      throw error;
    }
  }
}
