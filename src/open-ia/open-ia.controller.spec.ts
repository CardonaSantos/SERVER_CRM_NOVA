import { Test, TestingModule } from '@nestjs/testing';
import { OpenIaController } from './open-ia.controller';
import { OpenIaService } from './open-ia.service';

describe('OpenIaController', () => {
  let controller: OpenIaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpenIaController],
      providers: [OpenIaService],
    }).compile();

    controller = module.get<OpenIaController>(OpenIaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
