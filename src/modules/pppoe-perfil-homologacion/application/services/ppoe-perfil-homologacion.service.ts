import { Injectable } from '@nestjs/common';
import { CreatePpoePerfilHomologacionDto } from '../../dto/create-ppoe-perfil-homologacion.dto';
import { UpdatePpoePerfilHomologacionDto } from '../../dto/update-ppoe-perfil-homologacion.dto';

@Injectable()
export class PpoePerfilHomologacionService {
  create(createPpoePerfilHomologacionDto: CreatePpoePerfilHomologacionDto) {
    return 'This action adds a new ppoePerfilHomologacion';
  }

  findAll() {
    return `This action returns all ppoePerfilHomologacion`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ppoePerfilHomologacion`;
  }

  update(
    id: number,
    updatePpoePerfilHomologacionDto: UpdatePpoePerfilHomologacionDto,
  ) {
    return `This action updates a #${id} ppoePerfilHomologacion`;
  }

  remove(id: number) {
    return `This action removes a #${id} ppoePerfilHomologacion`;
  }
}
