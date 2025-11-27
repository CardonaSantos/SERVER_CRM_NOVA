import { Module } from '@nestjs/common';
import { OpenIaService } from './open-ia.service';
import { OpenIaController } from './open-ia.controller';

@Module({
  controllers: [OpenIaController],
  providers: [OpenIaService],
})
export class OpenIaModule {}
