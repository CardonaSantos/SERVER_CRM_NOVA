import { Controller } from '@nestjs/common';
import { ZonaFacturacionCronService } from './zona-facturacion-cron.service';

@Controller('zona-facturacion-cron')
export class ZonaFacturacionCronController {
  constructor(
    private readonly zonaFacturacionCronService: ZonaFacturacionCronService,
  ) {}
}
