import { Injectable, Logger } from '@nestjs/common';
import { CrmGateway } from './websocket.gateway';
import { BroadCastNewMessage } from './websocket.controller';
import { throwFatalError } from 'src/Utils/CommonFatalError';

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
    titulo: string;
    tecnico: string;
  }) {
    this.gateway.handleTicketChangeStatus(
      dto.empresaId,
      dto.ticketId,
      dto.nuevoEstado,
      dto.titulo,
      dto.tecnico,
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

  /**
   * Servicio que lanza evento socket, para la UI del CRM.
   * Primero recibe una peticion POST de nuestro servidor BOT
   * @param body EVENT:NOMBRE DE EVENTO, DATA:MENSAJE
   */
  async emitNewMessageNuvia(body: BroadCastNewMessage) {
    try {
      this.gateway.handleEmitNewNuviaMessage(1, body); //ARCODEADO POR EL MOMENTO
    } catch (error) {
      throwFatalError(error, this.logger, 'emitNewMessageNuvia');
    }
  }
}
