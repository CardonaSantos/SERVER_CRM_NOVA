import { Injectable, Logger } from '@nestjs/common';
import { CreateTwilioApiDto } from './dto/create-twilio-api.dto';
import { UpdateTwilioApiDto } from './dto/update-twilio-api.dto';
import { ConfigService } from '@nestjs/config';
import * as Twilio from 'twilio';
import { FiltersDto } from './dto/FilterDto';
import { Response } from 'express';
import type { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';
import * as dayjs from 'dayjs';
import 'dayjs/locale/es';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale('es');

export interface TwilioHistory {
  messages: MessageInstance[];
  nextPageToken: string | null;
  previousPageToken: string | null;
}

@Injectable()
export class TwilioApiService {
  private readonly logger = new Logger(TwilioApiService.name);
  private client: Twilio.Twilio;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.client = Twilio(accountSid, authToken);
  }

  async listMessages(filters: FiltersDto): Promise<TwilioHistory> {
    const opts: any = {
      pageSize: filters.limit,
      pageToken: filters.pageToken, // este debe ser SOLO el token (PAM...)
    };
    if (filters.from) opts.from = `whatsapp:${filters.from}`;
    if (filters.to) opts.to = `whatsapp:${filters.to}`;
    if (filters.dateAfter) opts.dateSentAfter = new Date(filters.dateAfter);
    if (filters.dateBefore) opts.dateSentBefore = new Date(filters.dateBefore);

    const page = await this.client.messages.page(opts);

    // Intenta leer page.nextPageToken / page.previousPageToken primero
    const rawNext = (page as any).nextPageToken ?? null;
    const rawPrev = (page as any).previousPageToken ?? null;

    // Si no existen, parsea la URL
    let nextToken: string | null = rawNext;
    let prevToken: string | null = rawPrev;
    if (!nextToken && page.nextPageUrl) {
      const u = new URL(page.nextPageUrl);
      nextToken = u.searchParams.get('PageToken');
    }
    if (!prevToken && page.previousPageUrl) {
      const u = new URL(page.previousPageUrl);
      prevToken = u.searchParams.get('PageToken');
    }

    // Filtra estado si hace falta
    let msgs = page.instances;
    if (filters.status) {
      msgs = msgs.filter((m) => m.status === filters.status);
    }
    console.log('El options es: ', opts);
    console.log('Los mensajes encontrados son: ', msgs.length);

    // Después:
    let orderMessages = msgs.sort((a, b) => {
      return dayjs(b.dateCreated).valueOf() - dayjs(a.dateCreated).valueOf();
    });

    return {
      messages: orderMessages,
      nextPageToken: nextToken,
      previousPageToken: prevToken,
    };
  }

  //**
  // Conseguir metadata del mensaje, como imagenes, audio, video, etc. Algo que el cliente ha respondido
  // */
  async getMessageMedia(messageSID: string) {
    const mediaList = await this.client.messages(messageSID).media.list();

    return mediaList.map((m) => ({
      sid: m.sid,
      contentType: m.contentType,
      uri: m.uri, //path relativo...
      url: `https://api.twilio.com${m.uri}`, // URL completo de Twilio
    }));
  }

  /**
   * Realiza streaming del contenido binario de un medio Twilio hacia el cliente
   * Usando axios para evitar limitaciones de RequestOpts en el SDK
   */
  async streamMedia(messageSid: string, mediaSid: string, res: Response) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    // 1) Obtener metadata para saber el Content-Type
    const media = await this.client
      .messages(messageSid)
      .media(mediaSid)
      .fetch();

    // 2) Construir URL del binario (removiendo .json)
    const binaryUri = media.uri.replace(/\.json$/, '');
    const twilioUrl = `https://api.twilio.com${binaryUri}`;

    // 3) Petición con axios para obtener el arraybuffer
    const axios = await import('axios');
    const response = await axios.default.get(twilioUrl, {
      responseType: 'arraybuffer',
      auth: { username: accountSid, password: authToken },
    });

    // 4) Enviar al cliente con el tipo correcto
    res.setHeader('Content-Type', media.contentType);
    res.send(response.data);
  }
}
