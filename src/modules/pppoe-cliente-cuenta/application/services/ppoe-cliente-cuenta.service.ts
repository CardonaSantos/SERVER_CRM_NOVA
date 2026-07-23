import { Injectable } from '@nestjs/common';
import { CreatePpoeClienteCuentaDto } from '../dto/create-ppoe-cliente-cuenta.dto';
import { UpdatePpoeClienteCuentaDto } from '../dto/update-ppoe-cliente-cuenta.dto';

@Injectable()
export class PpoeClienteCuentaService {
  create(createPpoeClienteCuentaDto: CreatePpoeClienteCuentaDto) {
    return 'This action adds a new ppoeClienteCuenta';
  }

  findAll() {
    return `This action returns all ppoeClienteCuenta`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ppoeClienteCuenta`;
  }

  update(id: number, updatePpoeClienteCuentaDto: UpdatePpoeClienteCuentaDto) {
    return `This action updates a #${id} ppoeClienteCuenta`;
  }

  remove(id: number) {
    return `This action removes a #${id} ppoeClienteCuenta`;
  }
}
