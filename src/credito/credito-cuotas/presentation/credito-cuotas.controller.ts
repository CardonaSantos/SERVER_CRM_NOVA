import { Controller, Post, Body } from '@nestjs/common';
import { CreditoCuotasService } from '../app/credito-cuotas.service';
import { CreateCreditoCuotaDto } from 'src/credito/credito-cuotas/dto/create-credito-cuota.dto';

@Controller('credito-cuotas')
export class CreditoCuotasController {
  constructor(private readonly creditoCuotasService: CreditoCuotasService) {}

  @Post()
  async create(@Body() createCreditoCuotaDto: CreateCreditoCuotaDto) {
    // return await this.cre
  }
}
