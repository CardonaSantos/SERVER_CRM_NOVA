import { Test, TestingModule } from '@nestjs/testing';
import { BanruralIntegrationController } from './banrural-integration.controller';
import { BanruralIntegrationService } from './banrural-integration.service';

describe('BanruralIntegrationController', () => {
  let controller: BanruralIntegrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BanruralIntegrationController],
      providers: [BanruralIntegrationService],
    }).compile();

    controller = module.get<BanruralIntegrationController>(BanruralIntegrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
