import { Module } from '@nestjs/common';
import { MigrateService } from './migrate.service';

@Module({
  providers: [MigrateService],
})
export class MigrateModule {}
