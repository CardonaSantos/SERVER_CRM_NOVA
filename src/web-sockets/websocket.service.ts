import { Injectable, Logger } from '@nestjs/common';

import { CrmGateway } from './websocket.gateway';
import { BroadCastNewMessage } from './websocket.controller';

import { throwFatalError } from 'src/Utils/CommonFatalError';

import { RealTimeLocationMapDto } from 'src/real-time-location/dto/dto-shape';

import type { TecnicoTrackingRealtimeView } from 'src/modules/real-time-location/domain/ports/tecnico-tracking-query.port';

import type { TecnicoTrackingStateChangedPayload } from 'src/modules/real-time-location/domain/ports/tecnico-tracking-realtime.port';

/*
 * =========================================================
 * TICKET ASSIGNMENT REALTIME CONTRACT
 * =========================================================
 *
 * Contrato temporal alojado aquí mientras tickets y
 * notificaciones terminan de migrarse a arquitectura
 * hexagonal.
 *
 * El consumidor móvil no necesita recibir el ticket
 * completo. Recibe únicamente la información necesaria
 * para:
 *
 * - saber qué cambió;
 * - informar al usuario;
 * - invalidar su cache;
 * - recuperar el estado real por HTTP.
 * =========================================================
 */

export const TICKET_ASSIGNMENT_CHANGED_EVENT =
  'ticket:assignment-changed' as const;

export type TicketAssignmentChange = 'ASSIGNED' | 'UNASSIGNED';

export type TicketAssignmentReason = 'CREATED' | 'REASSIGNED';

export interface TicketAssignmentChangedPayload {
  version: 1;

  ticketId: number;

  empresaId: number;

  change: TicketAssignmentChange;

  reason: TicketAssignmentReason;

  title: string;

  status: string;

  priority: string;

  occurredAt: string;
}

export interface EmitTicketAssignmentChangedParams {
  userIds: readonly number[];

  payload: TicketAssignmentChangedPayload;
}

@Injectable()
export class WebSocketServices {
  private readonly logger = new Logger(WebSocketServices.name);

  private static readonly TRACKING_EMPRESA_ID = 1;

  constructor(private readonly gateway: CrmGateway) {}

  /*
   * =========================================================
   * SYSTEM NOTIFICATIONS
   * =========================================================
   */

  async emitSystemNotification(empresaId: number, notification: any) {
    return await this.gateway.emitToEmpresa(
      empresaId,
      'notifications:system',
      notification,
    );
  }

  /*
   * =========================================================
   * TICKET STATUS
   * =========================================================
   */

  /**
   * Emitir el cambio de estado de un ticket de soporte
   * a la UI Dashboard.
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

  /*
   * =========================================================
   * TICKET ASSIGNMENTS
   * =========================================================
   *
   * Evento dirigido exclusivamente a los usuarios cuya
   * relación con un ticket acaba de cambiar.
   *
   * Ejemplos:
   *
   * A -> B
   *
   * user:A
   *   UNASSIGNED
   *
   * user:B
   *   ASSIGNED
   *
   * Si un usuario simplemente cambia entre principal y
   * acompañante, pero continúa asignado, este método no
   * debería ser llamado para él.
   * =========================================================
   */

  async emitTicketAssignmentChanged(
    params: EmitTicketAssignmentChangedParams,
  ): Promise<void> {
    const userIds = [
      ...new Set(
        params.userIds
          .map(Number)
          .filter((userId) => Number.isInteger(userId) && userId > 0),
      ),
    ];

    /*
     * Nada que emitir.
     *
     * Evitamos llamadas innecesarias al Gateway y dejamos
     * que el caller pueda entregar arrays vacíos sin tener
     * que añadir condiciones externas.
     */
    if (userIds.length === 0) {
      return;
    }

    try {
      this.gateway.emitToUsers(
        TICKET_ASSIGNMENT_CHANGED_EVENT,
        params.payload,
        userIds,
      );

      this.logger.debug(
        [
          'Ticket assignment realtime emitido',
          `ticketId=${params.payload.ticketId}`,
          `change=${params.payload.change}`,
          `reason=${params.payload.reason}`,
          `users=[${userIds.join(',')}]`,
        ].join(' | '),
      );
    } catch (error) {
      /*
       * Socket.IO es un efecto secundario posterior a la
       * persistencia.
       *
       * No propagamos este error porque una falla del canal
       * realtime no debe convertir en fallida una operación
       * de ticket que ya fue persistida correctamente.
       *
       * Cuando migremos este flujo a una estrategia durable
       * de eventos/outbox, esta responsabilidad podrá salir
       * completamente de este servicio.
       */
      this.logger.error(
        [
          'No fue posible emitir ticket:assignment-changed',
          `ticketId=${params.payload.ticketId}`,
          `change=${params.payload.change}`,
          `users=[${userIds.join(',')}]`,
        ].join(' | '),
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /*
   * =========================================================
   * RUTA / COBROS
   * =========================================================
   */

  /**
   * Emitir evento de cambio de rutas y cobros.
   */
  async sendRutaCobroEvent(dto: {
    empresaId: number;

    rutaId: number;
  }) {
    const { empresaId, rutaId } = dto;

    this.gateway.handleRutaChange(empresaId, rutaId);
  }

  /*
   * =========================================================
   * FACTURACIÓN
   * =========================================================
   */

  /**
   * Emitir evento de cambio de facturación:
   * pago y generación.
   */
  async sendFacturacionEvent(empresaId: number) {
    this.gateway.handleFacturacionChangeEvent(empresaId);
  }

  /*
   * =========================================================
   * NUVIA
   * =========================================================
   */

  /**
   * Servicio que lanza evento socket para la UI del CRM.
   *
   * Primero recibe una petición POST del servidor BOT.
   */
  async emitNewMessageNuvia(body: BroadCastNewMessage) {
    try {
      this.gateway.handleEmitNewNuviaMessage(1, body);
    } catch (error) {
      throwFatalError(error, this.logger, 'emitNewMessageNuvia');
    }
  }

  /*
   * =========================================================
   * LEGACY REAL TIME LOCATION
   * =========================================================
   */

  /**
   * Enviar por socket la ubicación en tiempo real
   * del usuario.
   */
  async emitRealTimeLocation(dto: {
    empresaId: number;

    payload: RealTimeLocationMapDto;
  }) {
    try {
      this.gateway.handleEmitRealTimeLocation(dto);
    } catch (error) {
      throwFatalError(error, this.logger, 'emitRealTimeLocation');
    }
  }

  /*
   * =========================================================
   * TRACKING REALTIME
   * =========================================================
   */

  async emitTecnicoTrackingLocation(
    payload: TecnicoTrackingRealtimeView,
  ): Promise<void> {
    this.gateway.emitToEmpresa(
      WebSocketServices.TRACKING_EMPRESA_ID,
      'tracking:location-updated',
      payload,
    );
  }

  async emitTecnicoTrackingStateChanged(
    payload: TecnicoTrackingStateChangedPayload,
  ): Promise<void> {
    this.gateway.emitToEmpresa(
      WebSocketServices.TRACKING_EMPRESA_ID,
      'tracking:state-changed',
      payload,
    );
  }
}
// import { Injectable, Logger } from '@nestjs/common';
// import { CrmGateway } from './websocket.gateway';
// import { BroadCastNewMessage } from './websocket.controller';
// import { throwFatalError } from 'src/Utils/CommonFatalError';
// import { RealTimeLocationMapDto } from 'src/real-time-location/dto/dto-shape';
// import type { TecnicoTrackingRealtimeView } from 'src/modules/real-time-location/domain/ports/tecnico-tracking-query.port';

// import type { TecnicoTrackingStateChangedPayload } from 'src/modules/real-time-location/domain/ports/tecnico-tracking-realtime.port';

// @Injectable()
// export class WebSocketServices {
//   private readonly logger = new Logger(WebSocketServices.name);
//   constructor(private readonly gateway: CrmGateway) {}
//   private static readonly TRACKING_EMPRESA_ID = 1;
//   async emitSystemNotification(empresaId: number, notification: any) {
//     return await this.gateway.emitToEmpresa(
//       empresaId,
//       'notifications:system',
//       notification,
//     );
//   }

//   /**
//    * Emitir el cambio de estado de un ticket de soporte a la UI Dashboard
//    * @param dto
//    */
//   async sendTicketSuportChangeStatus(dto: {
//     empresaId: number;
//     ticketId: number;
//     nuevoEstado: string;
//     titulo: string;
//     tecnico: string;
//   }) {
//     this.gateway.handleTicketChangeStatus(
//       dto.empresaId,
//       dto.ticketId,
//       dto.nuevoEstado,
//       dto.titulo,
//       dto.tecnico,
//     );
//   }

//   /**
//    * Emitir evento de cambio de rutas y cobros
//    * @param dto
//    */
//   async sendRutaCobroEvent(dto: { empresaId: number; rutaId: number }) {
//     const { empresaId, rutaId } = dto;
//     this.gateway.handleRutaChange(empresaId, rutaId);
//   }

//   /**
//    * Emitir evento de cambio de facturacion pago y generacion
//    * @param empresaId
//    */
//   async sendFacturacionEvent(empresaId: number) {
//     this.gateway.handleFacturacionChangeEvent(empresaId);
//   }

//   /**
//    * Servicio que lanza evento socket, para la UI del CRM.
//    * Primero recibe una peticion POST de nuestro servidor BOT
//    * @param body EVENT:NOMBRE DE EVENTO, DATA:MENSAJE
//    */
//   async emitNewMessageNuvia(body: BroadCastNewMessage) {
//     try {
//       this.gateway.handleEmitNewNuviaMessage(1, body); //ARCODEADO POR EL MOMENTO
//     } catch (error) {
//       throwFatalError(error, this.logger, 'emitNewMessageNuvia');
//     }
//   }

//   /**
//    * ENVIAR POR SOCKET LA UBICACION EN TIEMPO REAL DEL USUARIO
//    * @param dto
//    */
//   async emitRealTimeLocation(dto: {
//     empresaId: number;
//     payload: RealTimeLocationMapDto; // ← cambiar tipo aquí
//   }) {
//     try {
//       this.gateway.handleEmitRealTimeLocation(dto);
//     } catch (error) {
//       throwFatalError(error, this.logger, 'emitRealTimeLocation');
//     }
//   }

//   // NUEVOS METODOS DE ENVIO DE UBICACION REFACTORIZADOS
//   async emitTecnicoTrackingLocation(
//     payload: TecnicoTrackingRealtimeView,
//   ): Promise<void> {
//     this.gateway.emitToEmpresa(
//       WebSocketServices.TRACKING_EMPRESA_ID,

//       'tracking:location-updated',

//       payload,
//     );
//   }

//   async emitTecnicoTrackingStateChanged(
//     payload: TecnicoTrackingStateChangedPayload,
//   ): Promise<void> {
//     this.gateway.emitToEmpresa(
//       WebSocketServices.TRACKING_EMPRESA_ID,

//       'tracking:state-changed',

//       payload,
//     );
//   }
// }
