import { Test, TestingModule } from '@nestjs/testing';
import { SegundoRecordatorioCronService } from './segundo-recordatorio-cron.service';

describe('SegundoRecordatorioCronService', () => {
  let service: SegundoRecordatorioCronService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SegundoRecordatorioCronService],
    }).compile();

    service = module.get<SegundoRecordatorioCronService>(SegundoRecordatorioCronService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
