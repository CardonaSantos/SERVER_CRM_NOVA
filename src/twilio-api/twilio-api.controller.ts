import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  ParseEnumPipe,
} from '@nestjs/common';
import { TwilioApiService } from './twilio-api.service';
import { FiltersDto, MessageStatus } from './dto/FilterDto';

@Controller('twilio-api')
export class TwilioApiController {
  constructor(private readonly twilioApiService: TwilioApiService) {}

  @Get('get-messagin-historial')
  async listMessages(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('pageToken') pageToken?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('dateAfter') dateAfter?: string,
    @Query('dateBefore') dateBefore?: string,

    // ← Aquí marcamos el ParseEnumPipe como opcional:
    @Query('status', new ParseEnumPipe(MessageStatus, { optional: true }))
    status?: MessageStatus,
  ) {
    return this.twilioApiService.listMessages({
      limit,
      pageToken,
      from,
      to,
      dateAfter,
      dateBefore,
      status,
    });
  }
}
