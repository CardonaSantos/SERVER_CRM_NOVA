import { Module } from '@nestjs/common';
import { CuotasPagoService } from './app/cuotas-pago.service';
import { CuotasPagoController } from './presentation/cuotas-pago.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CUOTA_PAGO } from './domain/cuota-pago.repository';
import { PrismaCuotasPago } from './infraestructure/prisma-cuotas-pago.repo';
import { CreditoModule } from '../credito.module';

@Module({
  imports: [PrismaModule, CreditoModule],
  controllers: [CuotasPagoController],
  providers: [
    CuotasPagoService,
    {
      provide: CUOTA_PAGO,
      useClass: PrismaCuotasPago,
    },
  ],
})
export class CuotasPagoModule {}
