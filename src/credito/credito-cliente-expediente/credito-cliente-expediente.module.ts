import { Module } from '@nestjs/common';
import { CreditoClienteExpedienteService } from './credito-cliente-expediente.service';
import { CreditoClienteExpedienteController } from './credito-cliente-expediente.controller';

@Module({
  controllers: [CreditoClienteExpedienteController],
  providers: [CreditoClienteExpedienteService],
})
export class CreditoClienteExpedienteModule {}
