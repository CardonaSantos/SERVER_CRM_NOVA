import { Injectable } from '@nestjs/common';
import { CreatePerfilUsuarioDto } from './dto/create-perfil-usuario.dto';
import { UpdatePerfilUsuarioDto } from './dto/update-perfil-usuario.dto';

@Injectable()
export class PerfilUsuarioService {
  create(createPerfilUsuarioDto: CreatePerfilUsuarioDto) {
    return 'This action adds a new perfilUsuario';
  }

  findAll() {
    return `This action returns all perfilUsuario`;
  }

  findOne(id: number) {
    return `This action returns a #${id} perfilUsuario`;
  }

  update(id: number, updatePerfilUsuarioDto: UpdatePerfilUsuarioDto) {
    return `This action updates a #${id} perfilUsuario`;
  }

  remove(id: number) {
    return `This action removes a #${id} perfilUsuario`;
  }
}
