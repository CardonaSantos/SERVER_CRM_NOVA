import { Injectable } from '@nestjs/common';
import { CreatePppoeAuditoriaDto } from '../dto/create-pppoe-auditoria.dto';
import { UpdatePppoeAuditoriaDto } from '../dto/update-pppoe-auditoria.dto';

@Injectable()
export class PppoeAuditoriaService {
  create(createPppoeAuditoriaDto: CreatePppoeAuditoriaDto) {
    return 'This action adds a new pppoeAuditoria';
  }

  findAll() {
    return `This action returns all pppoeAuditoria`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pppoeAuditoria`;
  }

  update(id: number, updatePppoeAuditoriaDto: UpdatePppoeAuditoriaDto) {
    return `This action updates a #${id} pppoeAuditoria`;
  }

  remove(id: number) {
    return `This action removes a #${id} pppoeAuditoria`;
  }
}
