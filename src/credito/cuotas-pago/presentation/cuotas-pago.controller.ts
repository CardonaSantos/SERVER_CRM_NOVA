import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CuotasPagoService } from '../app/cuotas-pago.service';
import { CreateCuotasPagoDto } from '../dto/create-cuotas-pago.dto';
import { UpdateCuotasPagoDto } from '../dto/update-cuotas-pago.dto';

@Controller('cuotas-pago')
export class CuotasPagoController {
  constructor(private readonly cuotasPagoService: CuotasPagoService) {}

  @Post('create-pago')
  async createPagoCuota(@Body() dto: CreateCuotasPagoDto) {
    return this.cuotasPagoService.registrarPago(dto);
  }
}
