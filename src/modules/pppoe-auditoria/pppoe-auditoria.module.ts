import { Module } from '@nestjs/common';
import { PppoeAuditoriaService } from './application/services/pppoe-auditoria.service';
import { PppoeAuditoriaController } from './presentation/pppoe-auditoria.controller';

@Module({
  controllers: [PppoeAuditoriaController],
  providers: [PppoeAuditoriaService],
})
export class PppoeAuditoriaModule {}
