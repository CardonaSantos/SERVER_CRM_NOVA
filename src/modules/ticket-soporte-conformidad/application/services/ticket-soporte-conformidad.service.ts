import { Injectable } from '@nestjs/common';
import { CreateTicketSoporteConformidadDto } from '../dto/create-ticket-soporte-conformidad.dto';
import { UpdateTicketSoporteConformidadDto } from '../dto/update-ticket-soporte-conformidad.dto';

@Injectable()
export class TicketSoporteConformidadService {
  create(createTicketSoporteConformidadDto: CreateTicketSoporteConformidadDto) {
    return 'This action adds a new ticketSoporteConformidad';
  }

  findAll() {
    return `This action returns all ticketSoporteConformidad`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ticketSoporteConformidad`;
  }

  update(
    id: number,
    updateTicketSoporteConformidadDto: UpdateTicketSoporteConformidadDto,
  ) {
    return `This action updates a #${id} ticketSoporteConformidad`;
  }

  remove(id: number) {
    return `This action removes a #${id} ticketSoporteConformidad`;
  }
}
