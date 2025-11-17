import { Test, TestingModule } from '@nestjs/testing';
import { PerfilUsuarioController } from './perfil-usuario.controller';
import { PerfilUsuarioService } from './perfil-usuario.service';

describe('PerfilUsuarioController', () => {
  let controller: PerfilUsuarioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PerfilUsuarioController],
      providers: [PerfilUsuarioService],
    }).compile();

    controller = module.get<PerfilUsuarioController>(PerfilUsuarioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
