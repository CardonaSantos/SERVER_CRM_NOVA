import { Injectable } from '@nestjs/common';
import { CreatePppoeOperacionDto } from '../dto/create-pppoe-operacion.dto';
import { UpdatePppoeOperacionDto } from '../dto/update-pppoe-operacion.dto';

@Injectable()
export class PppoeOperacionService {
  create(createPppoeOperacionDto: CreatePppoeOperacionDto) {
    return 'This action adds a new pppoeOperacion';
  }

  findAll() {
    return `This action returns all pppoeOperacion`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pppoeOperacion`;
  }

  update(id: number, updatePppoeOperacionDto: UpdatePppoeOperacionDto) {
    return `This action updates a #${id} pppoeOperacion`;
  }

  remove(id: number) {
    return `This action removes a #${id} pppoeOperacion`;
  }
}
