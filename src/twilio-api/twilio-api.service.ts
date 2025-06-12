import { Injectable, Logger } from '@nestjs/common';
import { CreateTwilioApiDto } from './dto/create-twilio-api.dto';
import { UpdateTwilioApiDto } from './dto/update-twilio-api.dto';
import { ConfigService } from '@nestjs/config';
import * as Twilio from 'twilio';
import { FiltersDto } from './dto/FilterDto';

@Injectable()
export class TwilioApiService {
  private readonly logger = new Logger(TwilioApiService.name);
  private client: Twilio.Twilio;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.client = Twilio(accountSid, authToken);
  }

  async listMessages(filters: FiltersDto) {
    const opts: any = { limit: filters.limit };

    if (filters.pageToken) opts.pageToken = filters.pageToken;
    if (filters.from) opts.from = `whatsapp:${filters.from}`;
    if (filters.to) opts.to = `whatsapp:${filters.to}`;
    if (filters.dateAfter) opts.dateSentAfter = new Date(filters.dateAfter);
    if (filters.dateBefore) opts.dateSentBefore = new Date(filters.dateBefore);

    this.logger.debug(
      `Fetching Twilio messages with opts: ${JSON.stringify(opts)}`,
    );
    let messages = await this.client.messages.list(opts);

    if (filters.status) {
      messages = messages.filter((m) => m.status === filters.status);
    }

    return messages;
  }
}
