import { Module } from '@nestjs/common';
import { PerfilUsuarioService } from './perfil-usuario.service';
import { PerfilUsuarioController } from './perfil-usuario.controller';

@Module({
  controllers: [PerfilUsuarioController],
  providers: [PerfilUsuarioService],
})
export class PerfilUsuarioModule {}
