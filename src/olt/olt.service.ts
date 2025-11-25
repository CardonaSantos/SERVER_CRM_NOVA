import { Injectable } from '@nestjs/common';
import { CreateOltDto } from './dto/create-olt.dto';
import { UpdateOltDto } from './dto/update-olt.dto';

@Injectable()
export class OltService {
  create(createOltDto: CreateOltDto) {
    return 'This action adds a new olt';
  }

  findAll() {
    return `This action returns all olt`;
  }

  findOne(id: number) {
    return `This action returns a #${id} olt`;
  }

  update(id: number, updateOltDto: UpdateOltDto) {
    return `This action updates a #${id} olt`;
  }

  remove(id: number) {
    return `This action removes a #${id} olt`;
  }
}
