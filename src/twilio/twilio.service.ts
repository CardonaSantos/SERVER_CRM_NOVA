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
        to: `whatsapp:${to}`,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  create(createTwilioDto: CreateTwilioDto) {
    return 'This action adds a new twilio';
  }

  findAll() {
    return `This action returns all twilio`;
  }
}
