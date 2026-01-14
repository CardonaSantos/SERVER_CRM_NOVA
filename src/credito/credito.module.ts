import { Module } from '@nestjs/common';
import { CreditoService } from './app/credito.service';
import { CreditoController } from './presentation/credito.controller';
import { CreditoCuotasModule } from './credito-cuotas/credito-cuotas.module';
import { CreditoCronModule } from './credito-cron/credito-cron.module';
import { CuotasPagoModule } from './cuotas-pago/cuotas-pago.module';
import { CREDITO } from './domain/credito.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaCreditoRepository } from './infraestructure/prisma-credito.repository';
import { CreditoClienteExpedienteModule } from './credito-cliente-expediente/credito-cliente-expediente.module';

@Module({
  controllers: [CreditoController],
  providers: [
    CreditoService,
    {
      useClass: PrismaCreditoRepository,
      provide: CREDITO,
    },
  ],
  imports: [
    CreditoCuotasModule,
    CreditoCronModule,
    CuotasPagoModule,
    PrismaModule,
    CreditoClienteExpedienteModule,
  ],
})
export class CreditoModule {}
