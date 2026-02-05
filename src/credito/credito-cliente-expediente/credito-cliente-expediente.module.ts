import { Module } from '@nestjs/common';
import { CreditoClienteExpedienteService } from './app/credito-cliente-expediente.service';
import { CreditoClienteExpedienteController } from './presentation/credito-cliente-expediente.controller';
import { DigitalOceanMediaModule } from 'src/modules/digital-ocean-media/digital-ocean-media.module';
import { PrismaCreditoExpedienteRepository } from './infraestructure/PrismaCreditoClienteExpediente.repository';
import { CLIENTE_EXPEDIENTE_REPOSITORY } from './domain/credito-cliente-expediente.repository';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [DigitalOceanMediaModule, PrismaModule],
  controllers: [CreditoClienteExpedienteController],
  providers: [
    CreditoClienteExpedienteService,

    {
      useClass: PrismaCreditoExpedienteRepository,
      provide: CLIENTE_EXPEDIENTE_REPOSITORY,
    },
  ],
})
export class CreditoClienteExpedienteModule {}
