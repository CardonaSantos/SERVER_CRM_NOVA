import { Test, TestingModule } from '@nestjs/testing';
import { CloudApiMetaController } from './cloud-api-meta.controller';
import { CloudApiMetaService } from './cloud-api-meta.service';

describe('CloudApiMetaController', () => {
  let controller: CloudApiMetaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CloudApiMetaController],
      providers: [CloudApiMetaService],
    }).compile();

    controller = module.get<CloudApiMetaController>(CloudApiMetaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
