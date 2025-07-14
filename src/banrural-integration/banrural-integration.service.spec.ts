import { Test, TestingModule } from '@nestjs/testing';
import { BanruralIntegrationService } from './banrural-integration.service';

describe('BanruralIntegrationService', () => {
  let service: BanruralIntegrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BanruralIntegrationService],
    }).compile();

    service = module.get<BanruralIntegrationService>(BanruralIntegrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
