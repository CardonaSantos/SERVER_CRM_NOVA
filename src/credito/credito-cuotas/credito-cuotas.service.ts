import { Injectable } from '@nestjs/common';
import { CreateCreditoCuotaDto } from './dto/create-credito-cuota.dto';
import { UpdateCreditoCuotaDto } from './dto/update-credito-cuota.dto';

@Injectable()
export class CreditoCuotasService {
  create(createCreditoCuotaDto: CreateCreditoCuotaDto) {
    return 'This action adds a new creditoCuota';
  }

  findAll() {
    return `This action returns all creditoCuotas`;
  }

  findOne(id: number) {
    return `This action returns a #${id} creditoCuota`;
  }

  update(id: number, updateCreditoCuotaDto: UpdateCreditoCuotaDto) {
    return `This action updates a #${id} creditoCuota`;
  }

  remove(id: number) {
    return `This action removes a #${id} creditoCuota`;
  }
}
