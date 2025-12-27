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

  // POST
  async createSolucionTicket(dto: CreateTicketSolucioneDto) {
    try {
      const entidad = SolucionTicket.create(dto.solucion, dto.descripcion);
      return await this.ticketSolucionRepo.create(entidad);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'TicketSolucinoesService - deleteAll',
      );
    }
  }
  // GET ONE
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
// DELETE ALL 
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
// GET ALL 
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

  // DELETE ALL
  async deleteById(id:number){
    try {
      const record_deleted = await this.ticketSolucionRepo.deleteById(id)
      return record_deleted
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'TicketSolucinoesService - deleteById',
      );
    }
  }

  // UPDATE
  async update(id:number, dto:CreateTicketSolucioneDto ){
    return await this.ticketSolucionRepo.update(id, dto)
  }
}
