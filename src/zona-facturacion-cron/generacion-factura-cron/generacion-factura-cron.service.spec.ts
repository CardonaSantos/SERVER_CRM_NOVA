import { Test, TestingModule } from '@nestjs/testing';
import { GeneracionFacturaCronService } from './generacion-factura-cron.service';

describe('GeneracionFacturaCronService', () => {
  let service: GeneracionFacturaCronService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeneracionFacturaCronService],
    }).compile();

    service = module.get<GeneracionFacturaCronService>(GeneracionFacturaCronService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
