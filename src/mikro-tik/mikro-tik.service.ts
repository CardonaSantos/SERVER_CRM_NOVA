import { Injectable } from '@nestjs/common';
import { CreateMikroTikDto } from './dto/create-mikro-tik.dto';
import { UpdateMikroTikDto } from './dto/update-mikro-tik.dto';

@Injectable()
export class MikroTikService {
  create(createMikroTikDto: CreateMikroTikDto) {
    return 'This action adds a new mikroTik';
  }

  findAll() {
    return `This action returns all mikroTik`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mikroTik`;
  }

  update(id: number, updateMikroTikDto: UpdateMikroTikDto) {
    return `This action updates a #${id} mikroTik`;
  }

  remove(id: number) {
    return `This action removes a #${id} mikroTik`;
  }
}
