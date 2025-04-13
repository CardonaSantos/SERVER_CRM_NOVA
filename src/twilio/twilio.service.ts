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

  async sendWhatsApp(to: string, body: string) {
    try {
      return this.client.messages.create({
        body,
        from: process.env.TWILIO_WHATSAPP_FROM,
        to, // Ya está formateado como whatsapp:+502...
      });
    } catch (error) {
      console.log('Error al enviar mensaje con Twilio:', error);
      throw error;
    }
  }

  // async sendWhatsApp(to: string, body: string) {
  //   try {
  //     return this.client.messages.create({
  //       body,
  //       from: process.env.TWILIO_WHATSAPP_FROM,
  //       to,
  //     });
  //   } catch (error) {
  //     console.log('Error al enviar WhatsApp:', error);
  //     throw error;
  //   }
  // }
}
