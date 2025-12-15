import { Test, TestingModule } from '@nestjs/testing';
import { CloudApiMetaService } from './cloud-api-meta.service';

describe('CloudApiMetaService', () => {
  let service: CloudApiMetaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudApiMetaService],
    }).compile();

    service = module.get<CloudApiMetaService>(CloudApiMetaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
