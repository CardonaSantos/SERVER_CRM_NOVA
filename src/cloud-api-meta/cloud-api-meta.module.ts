import { Module } from '@nestjs/common';
import { CloudApiMetaService } from './cloud-api-meta.service';
import { CloudApiMetaController } from './cloud-api-meta.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [CloudApiMetaController],
  providers: [CloudApiMetaService],
  exports: [CloudApiMetaService],
})
export class CloudApiMetaModule {}
