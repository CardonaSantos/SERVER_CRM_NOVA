import { Controller } from '@nestjs/common';
import { CreditoCronService } from '../app/credito-cron.service';

@Controller('credito-cron')
export class CreditoCronController {
  constructor(private readonly creditoCronService: CreditoCronService) {}
}
