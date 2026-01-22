import { Module } from '@nestjs/common';
import { CreditoCuotasService } from './app/credito-cuotas.service';
import { CreditoCuotasController } from './presentation/credito-cuotas.controller';
import { CREDITO_CUOTA } from './entities/credito-cuota.entity';
import { PrismaCuotaCreditoRepository } from './infraestructure/prisma-cuota-credito.repository';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [CreditoCuotasController],
  providers: [
    CreditoCuotasService,
    {
      provide: CREDITO_CUOTA,
      useClass: PrismaCuotaCreditoRepository,
    },
  ],
  exports: [CreditoCuotasService],
  imports: [PrismaModule],
})
export class CreditoCuotasModule {}
