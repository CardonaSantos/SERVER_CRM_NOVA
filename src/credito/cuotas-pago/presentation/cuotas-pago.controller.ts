import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Delete,
  Logger,
} from '@nestjs/common';
import { CuotasPagoService } from '../app/cuotas-pago.service';
import { CreateCuotasPagoDto } from '../dto/create-cuotas-pago.dto';
import { DeletePagoCuotaDto } from '../dto/delete-pago.dto';

@Controller('cuotas-pago')
export class CuotasPagoController {
  private readonly logger = new Logger(CuotasPagoController.name);
  constructor(private readonly cuotasPagoService: CuotasPagoService) {}

  @Post('create-pago')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async createPagoCuota(@Body() dto: CreateCuotasPagoDto) {
    return this.cuotasPagoService.registrarPago(dto);
  }

  @Post('delete-pago')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async deletePagoCuota(@Body() dto: DeletePagoCuotaDto) {
    this.logger.log(`DTO recibido:\n${JSON.stringify(dto, null, 2)}`);
    return this.cuotasPagoService.deletePago(dto.pagoCuotaId);
  }
}
