import { Module } from '@nestjs/common';
import { CuotasPagoService } from './app/cuotas-pago.service';
import { CuotasPagoController } from './presentation/cuotas-pago.controller';

@Module({
  controllers: [CuotasPagoController],
  providers: [CuotasPagoService],
})
export class CuotasPagoModule {}
