import { Test, TestingModule } from '@nestjs/testing';
import { TwilioMensajesService } from './twilio-mensajes.service';

describe('TwilioMensajesService', () => {
  let service: TwilioMensajesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TwilioMensajesService],
    }).compile();

    service = module.get<TwilioMensajesService>(TwilioMensajesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
