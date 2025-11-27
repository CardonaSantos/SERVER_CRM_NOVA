import { Test, TestingModule } from '@nestjs/testing';
import { OpenIaService } from './open-ia.service';

describe('OpenIaService', () => {
  let service: OpenIaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenIaService],
    }).compile();

    service = module.get<OpenIaService>(OpenIaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
