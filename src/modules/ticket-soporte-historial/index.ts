export { TicketSoporteHistorialModule } from './ticket-soporte-historial.module';
export { TicketSoporteHistorialService } from './application/services/ticket-soporte-historial.service';
export { TicketSoporteHistorialPrismaTxBridge } from './infra/prisma/ticket-soporte-historial-prisma-tx.bridge';
export { TicketSoporteHistorialTipo } from './domain/enums/ticket-soporte-historial-tipo.enum';
export type { RegistrarTicketHistorialCommand } from './application/contracts/registrar-ticket-historial.command';
export type { RegistrarActualizacionTicketCommand } from './application/contracts/registrar-actualizacion-ticket.command';
export type {
  TicketHistorialActor,
  TicketHistorialCambio,
  TicketHistorialCampo,
  TicketHistorialValor,
} from './domain/types/ticket-historial-cambio.type';
