import { Injectable } from '@nestjs/common';
import { CreateCuotasPagoDto } from './dto/create-cuotas-pago.dto';
import { UpdateCuotasPagoDto } from './dto/update-cuotas-pago.dto';

@Injectable()
export class CuotasPagoService {
  create(createCuotasPagoDto: CreateCuotasPagoDto) {
    return 'This action adds a new cuotasPago';
  }

  findAll() {
    return `This action returns all cuotasPago`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cuotasPago`;
  }

  update(id: number, updateCuotasPagoDto: UpdateCuotasPagoDto) {
    return `This action updates a #${id} cuotasPago`;
  }

  remove(id: number) {
    return `This action removes a #${id} cuotasPago`;
  }
}
