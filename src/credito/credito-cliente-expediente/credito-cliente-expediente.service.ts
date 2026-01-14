import { Injectable } from '@nestjs/common';
import { CreateCreditoClienteExpedienteDto } from './dto/create-credito-cliente-expediente.dto';
import { UpdateCreditoClienteExpedienteDto } from './dto/update-credito-cliente-expediente.dto';

@Injectable()
export class CreditoClienteExpedienteService {
  create(createCreditoClienteExpedienteDto: CreateCreditoClienteExpedienteDto) {
    return 'This action adds a new creditoClienteExpediente';
  }

  findAll() {
    return `This action returns all creditoClienteExpediente`;
  }

  findOne(id: number) {
    return `This action returns a #${id} creditoClienteExpediente`;
  }

  update(id: number, updateCreditoClienteExpedienteDto: UpdateCreditoClienteExpedienteDto) {
    return `This action updates a #${id} creditoClienteExpediente`;
  }

  remove(id: number) {
    return `This action removes a #${id} creditoClienteExpediente`;
  }
}
