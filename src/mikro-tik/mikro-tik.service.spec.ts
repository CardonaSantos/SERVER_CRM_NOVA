import { Test, TestingModule } from '@nestjs/testing';
import { MikroTikService } from './mikro-tik.service';

describe('MikroTikService', () => {
  let service: MikroTikService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MikroTikService],
    }).compile();

    service = module.get<MikroTikService>(MikroTikService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
