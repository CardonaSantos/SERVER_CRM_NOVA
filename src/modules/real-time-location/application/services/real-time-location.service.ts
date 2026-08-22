import { Injectable } from '@nestjs/common';
import { CreateRealTimeLocationDto } from '../dto/create-real-time-location.dto';
import { UpdateRealTimeLocationDto } from '../dto/update-real-time-location.dto';

@Injectable()
export class RealTimeLocationService {
  create(createRealTimeLocationDto: CreateRealTimeLocationDto) {
    return 'This action adds a new realTimeLocation';
  }

  findAll() {
    return `This action returns all realTimeLocation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} realTimeLocation`;
  }

  update(id: number, updateRealTimeLocationDto: UpdateRealTimeLocationDto) {
    return `This action updates a #${id} realTimeLocation`;
  }

  remove(id: number) {
    return `This action removes a #${id} realTimeLocation`;
  }
}
