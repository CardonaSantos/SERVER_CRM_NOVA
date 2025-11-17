import { Test, TestingModule } from '@nestjs/testing';
import { PerfilUsuarioService } from './perfil-usuario.service';

describe('PerfilUsuarioService', () => {
  let service: PerfilUsuarioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PerfilUsuarioService],
    }).compile();

    service = module.get<PerfilUsuarioService>(PerfilUsuarioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
