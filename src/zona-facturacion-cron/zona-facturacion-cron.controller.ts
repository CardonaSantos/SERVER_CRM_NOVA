import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ZonaFacturacionCronService } from './zona-facturacion-cron.service';
import { CreateZonaFacturacionCronDto } from './dto/create-zona-facturacion-cron.dto';
import { UpdateZonaFacturacionCronDto } from './dto/update-zona-facturacion-cron.dto';

@Controller('zona-facturacion-cron')
export class ZonaFacturacionCronController {
  constructor(
    private readonly zonaFacturacionCronService: ZonaFacturacionCronService,
  ) {}
}
