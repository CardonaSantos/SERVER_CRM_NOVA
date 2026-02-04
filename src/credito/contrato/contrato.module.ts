import { Module } from '@nestjs/common';
import { ContratoService } from './app/contrato.service';
import { ContratoController } from './presentation/contrato.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CONTRATO_CREDITO_REPOSITORY } from './domain/contrato-credito.repository';
import { PrismaContratoCredito } from './infraestructure/prisma-contrato-credito.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ContratoController],
  providers: [
    ContratoService,
    {
      provide: CONTRATO_CREDITO_REPOSITORY,
      useClass: PrismaContratoCredito,
    },
  ],
})
export class ContratoModule {}
