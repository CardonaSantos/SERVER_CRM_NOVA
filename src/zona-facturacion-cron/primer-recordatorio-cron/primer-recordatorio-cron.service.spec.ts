import { Test, TestingModule } from '@nestjs/testing';
import { PrimerRecordatorioCronService } from './primer-recordatorio-cron.service';

describe('PrimerRecordatorioCronService', () => {
  let service: PrimerRecordatorioCronService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrimerRecordatorioCronService],
    }).compile();

    service = module.get<PrimerRecordatorioCronService>(PrimerRecordatorioCronService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
