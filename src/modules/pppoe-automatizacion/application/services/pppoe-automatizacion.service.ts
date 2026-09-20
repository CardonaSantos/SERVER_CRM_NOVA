import { Injectable } from '@nestjs/common';
import { CreatePppoeAutomatizacionDto } from '../dto/create-pppoe-automatizacion.dto';
import { UpdatePppoeAutomatizacionDto } from '../dto/update-pppoe-automatizacion.dto';

@Injectable()
export class PppoeAutomatizacionService {
  create(createPppoeAutomatizacionDto: CreatePppoeAutomatizacionDto) {
    return 'This action adds a new pppoeAutomatizacion';
  }

  findAll() {
    return `This action returns all pppoeAutomatizacion`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pppoeAutomatizacion`;
  }

  update(
    id: number,
    updatePppoeAutomatizacionDto: UpdatePppoeAutomatizacionDto,
  ) {
    return `This action updates a #${id} pppoeAutomatizacion`;
  }

  remove(id: number) {
    return `This action removes a #${id} pppoeAutomatizacion`;
  }
}
