import { Test, TestingModule } from '@nestjs/testing';
import { OltController } from './olt.controller';
import { OltService } from './olt.service';

describe('OltController', () => {
  let controller: OltController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OltController],
      providers: [OltService],
    }).compile();

    controller = module.get<OltController>(OltController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
