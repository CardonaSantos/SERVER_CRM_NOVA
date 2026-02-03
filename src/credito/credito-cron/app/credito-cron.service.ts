import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CREDITO_CRON_REPOSITORY } from '../domain/credito-cron.repository';
import { PrismaCreditoCronRepository } from '../infraestructure/prisma-credito-cron.repository';

@Injectable()
export class CreditoCronService {
  constructor(
    @Inject(CREDITO_CRON_REPOSITORY)
    private readonly credito_cron_repo: PrismaCreditoCronRepository,
  ) {}

  // @Cron(CronExpression.EVERY_MINUTE)
  @Cron('0 1 * * *', { timeZone: 'America/Guatemala' })
  async generateMoraCreditoCuota() {
    await this.credito_cron_repo.generateMoraCreditoCuota();
  }
}
