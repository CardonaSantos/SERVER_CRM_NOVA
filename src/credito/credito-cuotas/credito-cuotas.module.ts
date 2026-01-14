import { Module } from '@nestjs/common';
import { CreditoCuotasService } from './credito-cuotas.service';
import { CreditoCuotasController } from './credito-cuotas.controller';

@Module({
  controllers: [CreditoCuotasController],
  providers: [CreditoCuotasService],
})
export class CreditoCuotasModule {}
