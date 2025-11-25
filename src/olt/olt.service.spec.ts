import { Test, TestingModule } from '@nestjs/testing';
import { OltService } from './olt.service';

describe('OltService', () => {
  let service: OltService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OltService],
    }).compile();

    service = module.get<OltService>(OltService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
