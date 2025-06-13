import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  ParseEnumPipe,
  Param,
  Res, //Este es diferente del de Express
} from '@nestjs/common';
import { Response } from 'express';

import { TwilioApiService, TwilioHistory } from './twilio-api.service';
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
    @Query('status', new ParseEnumPipe(MessageStatus, { optional: true }))
    status?: MessageStatus,
  ): Promise<TwilioHistory> {
    const filters: FiltersDto = {
      limit,
      pageToken,
      from,
      to,
      dateAfter,
      dateBefore,
      status,
    };
    return this.twilioApiService.listMessages(filters);
  }

  /**
   * Devuelve metadata de todos los medios adjuntos a un mensaje
   */
  @Get('messages/:sid/media')
  async listMedia(@Param('sid') sid: string) {
    return this.twilioApiService.getMessageMedia(sid);
  }

  /**
   * Stream del contenido binario de un medio específico
   */
  @Get('messages/:sid/media/:mediaSid')
  async serveMedia(
    @Param('sid') sid: string,
    @Param('mediaSid') mediaSid: string,
    @Res() res: Response,
  ) {
    await this.twilioApiService.streamMedia(sid, mediaSid, res);
  }
}
