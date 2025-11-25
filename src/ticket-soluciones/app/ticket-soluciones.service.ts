import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateTicketSolucioneDto } from '../dto/create-ticket-solucione.dto';
import { SolucionTicket } from '../domain/ticket-soluciones.entity';
import { TicketSolucionRepository } from '../domain/ticket-solucion.repository';
import { throwFatalError } from 'src/Utils/CommonFatalError';
//EL SERVICE DE APP, DEBE SER CONSUMIDOR POR EL CONTROLLADOR
@Injectable()
export class TicketSolucionesService {
  private readonly logger = new Logger(TicketSolucionesService.name);
  constructor(private readonly ticketSolucionRepo: TicketSolucionRepository) {}

  async createSolucionTicket(dto: CreateTicketSolucioneDto) {
    try {
      const entidad = SolucionTicket.create(dto.solucion, dto.descripcion);
      return this.ticketSolucionRepo.create(entidad);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'TicketSolucinoesService - deleteAll',
      );
    }
  }

  async getById(id: number) {
    try {
      const record = await this.ticketSolucionRepo.findById(id);

      if (!record) {
        throw new NotFoundException('Solución de ticket no encontrada');
      }
      return record;
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'TicketSolucinoesService - deleteAll',
      );
    }
  }

  async deleteAll() {
    try {
      const deletedSolutions = await this.ticketSolucionRepo.deleteAll();

      return deletedSolutions;
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'TicketSolucinoesService - deleteAll',
      );
    }
  }

  async getAll() {
    try {
      const records = await this.ticketSolucionRepo.getAll();
      return records;
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'TicketSolucinoesService - deleteAll',
      );
    }
  }
}
