import { Injectable } from '@nestjs/common';
import { CreatePpoeInstalacionAccesoDto } from './dto/create-ppoe-instalacion-acceso.dto';
import { UpdatePpoeInstalacionAccesoDto } from './dto/update-ppoe-instalacion-acceso.dto';

@Injectable()
export class PpoeInstalacionAccesoService {
  create(createPpoeInstalacionAccesoDto: CreatePpoeInstalacionAccesoDto) {
    return 'This action adds a new ppoeInstalacionAcceso';
  }

  findAll() {
    return `This action returns all ppoeInstalacionAcceso`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ppoeInstalacionAcceso`;
  }

  update(id: number, updatePpoeInstalacionAccesoDto: UpdatePpoeInstalacionAccesoDto) {
    return `This action updates a #${id} ppoeInstalacionAcceso`;
  }

  remove(id: number) {
    return `This action removes a #${id} ppoeInstalacionAcceso`;
  }
}
