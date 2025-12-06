import { Injectable, Logger } from '@nestjs/common';
import { CrmGateway } from './websocket.gateway';

@Injectable()
export class WebSocketServices {
  private readonly logger = new Logger(WebSocketServices.name);
  constructor(private readonly gateway: CrmGateway) {}

  /**
   * Emitir el cambio de estado de un ticket de soporte a la UI Dashboard
   * @param dto
   */
  async sendTicketSuportChangeStatus(dto: {
    empresaId: number;
    ticketId: number;
    nuevoEstado: string;
  }) {
    this.gateway.handleTicketChangeStatus(
      dto.empresaId,
      dto.ticketId,
      dto.nuevoEstado,
    );
  }

  /**
   * Emitir evento de cambio de rutas y cobros
   * @param dto
   */
  async sendRutaCobroEvent(dto: { empresaId: number; rutaId: number }) {
    const { empresaId, rutaId } = dto;
    this.gateway.handleRutaChange(empresaId, rutaId);
  }

  /**
   * Emitir evento de cambio de facturacion pago y generacion
   * @param empresaId
   */
  async sendFacturacionEvent(empresaId: number) {
    this.gateway.handleFacturacionChangeEvent(empresaId);
  }
}
