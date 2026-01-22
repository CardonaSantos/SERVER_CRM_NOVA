import { Injectable, Logger } from '@nestjs/common';
import { CreateCreditoCuotaDto } from '../dto/create-credito-cuota.dto';
import { UpdateCreditoCuotaDto } from '../dto/update-credito-cuota.dto';
import { CreateCuotaCustomDto } from 'src/credito/credito-cuotas/dto/create-cuota-custom.dto';

@Injectable()
export class CreditoCuotasService {
  private readonly logger = new Logger(CreditoCuotasService.name);
  create(dto: CreateCreditoCuotaDto) {
    this.logger.log('Cuotas son: ', dto);

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
