import { Test, TestingModule } from '@nestjs/testing';
import { DigitalOceanMediaService } from './digital-ocean-media.service';

describe('DigitalOceanMediaService', () => {
  let service: DigitalOceanMediaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DigitalOceanMediaService],
    }).compile();

    service = module.get<DigitalOceanMediaService>(DigitalOceanMediaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
