import { Test, TestingModule } from '@nestjs/testing';
import { MikroTikController } from './mikro-tik.controller';
import { MikroTikService } from './mikro-tik.service';

describe('MikroTikController', () => {
  let controller: MikroTikController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MikroTikController],
      providers: [MikroTikService],
    }).compile();

    controller = module.get<MikroTikController>(MikroTikController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
