import { Test, TestingModule } from '@nestjs/testing';
import { DigitalOceanMediaController } from './digital-ocean-media.controller';
import { DigitalOceanMediaService } from './digital-ocean-media.service';

describe('DigitalOceanMediaController', () => {
  let controller: DigitalOceanMediaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DigitalOceanMediaController],
      providers: [DigitalOceanMediaService],
    }).compile();

    controller = module.get<DigitalOceanMediaController>(DigitalOceanMediaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
