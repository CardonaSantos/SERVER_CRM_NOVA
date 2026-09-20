import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TicketConformidadLinkConfigPort } from '../../application/port/ticket-conformidad-link-config.port';

@Injectable()
export class TicketConformidadLinkConfigAdapter
  implements TicketConformidadLinkConfigPort
{
  constructor(private readonly configService: ConfigService) {}

  getTtlMinutes(): number {
    const rawValue = this.configService.get<string>(
      'TICKET_CONFORMIDAD_LINK_TTL_MINUTES',
    );

    if (!rawValue) {
      throw new Error(
        'TICKET_CONFORMIDAD_LINK_TTL_MINUTES no está configurado.',
      );
    }

    const ttlMinutes = Number(rawValue);

    if (!Number.isInteger(ttlMinutes) || ttlMinutes <= 0) {
      throw new Error(
        'TICKET_CONFORMIDAD_LINK_TTL_MINUTES debe ser un entero positivo.',
      );
    }

    return ttlMinutes;
  }
}
