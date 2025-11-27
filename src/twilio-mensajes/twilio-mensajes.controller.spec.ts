import { Test, TestingModule } from '@nestjs/testing';
import { TwilioMensajesController } from './twilio-mensajes.controller';
import { TwilioMensajesService } from './twilio-mensajes.service';

describe('TwilioMensajesController', () => {
  let controller: TwilioMensajesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwilioMensajesController],
      providers: [TwilioMensajesService],
    }).compile();

    controller = module.get<TwilioMensajesController>(TwilioMensajesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
