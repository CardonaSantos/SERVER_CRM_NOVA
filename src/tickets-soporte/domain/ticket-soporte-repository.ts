import { TicketSoporte } from '../entities/tickets-soporte.entity';

export const TICKET_SOPORTE_REPOSITORY = Symbol('TICKET_SOPORTE_REPOSITORY');

export interface TicketSoporteRepository {
  create(ticket: TicketSoporte): Promise<TicketSoporte>;

  update(ticket: TicketSoporte): Promise<TicketSoporte>;

  findById(id: number): Promise<TicketSoporte | null>;

  findAbiertosByCliente(clienteId: number): Promise<TicketSoporte[]>;

  findAbiertosByTecnico(tecnicoId: number): Promise<TicketSoporte[]>;

  findByEmpresa(params: {
    empresaId: number;
    estado?: string;
    prioridad?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: TicketSoporte[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Tiempo efectivo de trabajo técnico registrado
   * mediante los ciclos de TicketTimeLog.
   *
   * NO representa el tiempo calendario
   * transcurrido desde apertura hasta cierre.
   */
  obtenerTiempoTecnicoTrabajado(ticketId: number): Promise<number>;
}

// import { CreateBotFunctionDto } from 'src/bot-functions/dto/create-bot-function.dto';
// import { TicketSoporte } from '../entities/tickets-soporte.entity';

// export const TICKET_SOPORTE_REPOSITORY = Symbol('TICKET_SOPORTE_REPOSITORY');

// export interface TicketSoporteRepository {
//   create(ticket: TicketSoporte): Promise<TicketSoporte>;
//   update(ticket: TicketSoporte): Promise<TicketSoporte>;
//   findById(id: number): Promise<TicketSoporte | null>;

//   findAbiertosByCliente(clienteId: number): Promise<TicketSoporte[]>;
//   findAbiertosByTecnico(tecnicoId: number): Promise<TicketSoporte[]>;

//   findByEmpresa(params: {
//     empresaId: number;
//     estado?: string;
//     prioridad?: string;
//     page?: number;
//     limit?: number;
//   }): Promise<{
//     items: TicketSoporte[];
//     total: number;
//     page: number;
//     limit: number;
//   }>;

//   obtenerTiempoTotalTrabajado(ticketId: number): Promise<number>;
// }
