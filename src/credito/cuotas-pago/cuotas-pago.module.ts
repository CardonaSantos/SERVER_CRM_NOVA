import { Module } from '@nestjs/common';
import { CuotasPagoService } from './cuotas-pago.service';
import { CuotasPagoController } from './cuotas-pago.controller';

@Module({
  controllers: [CuotasPagoController],
  providers: [CuotasPagoService],
})
export class CuotasPagoModule {}
