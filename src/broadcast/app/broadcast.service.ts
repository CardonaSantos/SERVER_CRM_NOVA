import { Injectable } from '@nestjs/common';
import { UpdateBroadcastDto } from '../dto/update-broadcast.dto';
import { CreateBroadcastDto } from '../dto/create-broadcast.dto';

@Injectable()
export class BroadcastService {
  create(createBroadcastDto: CreateBroadcastDto) {
    return 'This action adds a new broadcast';
  }

  findAll() {
    return `This action returns all broadcast`;
  }

  findOne(id: number) {
    return `This action returns a #${id} broadcast`;
  }

  update(id: number, updateBroadcastDto: UpdateBroadcastDto) {
    return `This action updates a #${id} broadcast`;
  }

  remove(id: number) {
    return `This action removes a #${id} broadcast`;
  }
}
