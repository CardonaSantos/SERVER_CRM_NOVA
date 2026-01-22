import { Module } from '@nestjs/common';
import { CreditoCuotasService } from './app/credito-cuotas.service';
import { CreditoCuotasController } from './presentation/credito-cuotas.controller';

@Module({
  controllers: [CreditoCuotasController],
  providers: [CreditoCuotasService],
  exports: [CreditoCuotasService],
})
export class CreditoCuotasModule {}
