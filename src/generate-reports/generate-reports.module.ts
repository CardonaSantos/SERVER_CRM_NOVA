import { Module } from '@nestjs/common';
import { GenerateReportsService } from './app/generate-reports.service';
import { GenerateReportsController } from './presentation/generate-reports.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GENERATE_REPORTS } from './domain/generate-reports.repository';
import { PrismaGenerateReports } from './infraestructure/prisma-generate-reports.repository';

@Module({
  imports: [PrismaModule],
  controllers: [GenerateReportsController],
  providers: [
    GenerateReportsService,
    {
      provide: GENERATE_REPORTS,
      useClass: PrismaGenerateReports,
    },
  ],
})
export class GenerateReportsModule {}
