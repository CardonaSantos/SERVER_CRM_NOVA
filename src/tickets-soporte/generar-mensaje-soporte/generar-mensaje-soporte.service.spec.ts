import { Test, TestingModule } from '@nestjs/testing';
import { GenerarMensajeSoporteService } from './generar-mensaje-soporte.service';

describe('GenerarMensajeSoporteService', () => {
  let service: GenerarMensajeSoporteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerarMensajeSoporteService],
    }).compile();

    service = module.get<GenerarMensajeSoporteService>(GenerarMensajeSoporteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
