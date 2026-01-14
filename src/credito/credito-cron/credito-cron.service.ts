import { Injectable } from '@nestjs/common';
import { CreateCreditoCronDto } from './dto/create-credito-cron.dto';
import { UpdateCreditoCronDto } from './dto/update-credito-cron.dto';

@Injectable()
export class CreditoCronService {
  create(createCreditoCronDto: CreateCreditoCronDto) {
    return 'This action adds a new creditoCron';
  }

  findAll() {
    return `This action returns all creditoCron`;
  }

  findOne(id: number) {
    return `This action returns a #${id} creditoCron`;
  }

  update(id: number, updateCreditoCronDto: UpdateCreditoCronDto) {
    return `This action updates a #${id} creditoCron`;
  }

  remove(id: number) {
    return `This action removes a #${id} creditoCron`;
  }
}
