import { Module } from '@nestjs/common';
import { MetricasTicketsService } from './metricas-tickets.service';
import { MetricasTicketsController } from './metricas-tickets.controller';

@Module({
  controllers: [MetricasTicketsController],
  providers: [MetricasTicketsService],
})
export class MetricasTicketsModule {}
