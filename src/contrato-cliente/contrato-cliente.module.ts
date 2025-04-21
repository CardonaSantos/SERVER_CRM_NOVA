import { Module } from '@nestjs/common';
import { ContratoClienteService } from './contrato-cliente.service';
import { ContratoClienteController } from './contrato-cliente.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ContratoClienteController],
  providers: [ContratoClienteService, PrismaService],
})
export class ContratoClienteModule {}
