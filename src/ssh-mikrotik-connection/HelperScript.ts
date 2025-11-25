import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

// @Injectable() para que NestJS pueda gestionarla.
@Injectable()
export class ScriptHelper {
  public readonly SCRIPTS_MIKROTIK: {
    SUSPENDER: string;
    ACTIVAR: string;
    BAJAR_PLAN: string;
  };

  constructor(private readonly configService: ConfigService) {
    this.SCRIPTS_MIKROTIK = {
      SUSPENDER: this.configService.get<string>('MIKROTIK_USER'),
      ACTIVAR: this.configService.get<string>('MIKROTIK_PASS'),
      BAJAR_PLAN: this.configService.get<string>('MIKROTIK_PASS'),
    };
  }
}
