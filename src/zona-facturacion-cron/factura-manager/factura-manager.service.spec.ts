import { Test, TestingModule } from '@nestjs/testing';
import { FacturaManagerService } from './factura-manager.service';

describe('FacturaManagerService', () => {
  let service: FacturaManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FacturaManagerService],
    }).compile();

    service = module.get<FacturaManagerService>(FacturaManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
