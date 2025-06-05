import { Test, TestingModule } from '@nestjs/testing';
import { RecordatorioDiaPagoService } from './recordatorio-dia-pago.service';

describe('RecordatorioDiaPagoService', () => {
  let service: RecordatorioDiaPagoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecordatorioDiaPagoService],
    }).compile();

    service = module.get<RecordatorioDiaPagoService>(RecordatorioDiaPagoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
