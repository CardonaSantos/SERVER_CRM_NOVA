// src/tickets/domain/entities/ticket-resumen.entity.ts
import { TicketResumen as TicketResumenRow } from '@prisma/client';

export interface TicketResumenProps {
  id?: number;

  ticketId: number;
  solucionId: number | null;

  resueltoComo: string | null;
  notasInternas: string | null;

  reabierto: boolean;
  numeroReaperturas: number;
  intentos: number;

  tiempoTotalMinutos: number | null;
  tiempoTecnicoMinutos: number | null;

  creadoEn: Date;
  actualizadoEn: Date;
}

export class TicketResumen {
  private constructor(private props: TicketResumenProps) {}

  // ========= FACTORÍA DE DOMINIO (para crear un resumen nuevo) =========
  static create(params: {
    ticketId: number;
    solucionId?: number | null;

    resueltoComo?: string | null;
    notasInternas?: string | null;

    reabierto?: boolean;
    numeroReaperturas?: number;
    intentos?: number;

    tiempoTotalMinutos?: number | null;
    tiempoTecnicoMinutos?: number | null;

    id?: number;
    creadoEn?: Date;
    actualizadoEn?: Date;
  }): TicketResumen {
    const {
      ticketId,
      solucionId,

      resueltoComo,
      notasInternas,

      reabierto = false,
      numeroReaperturas = 0,
      intentos = 1,

      tiempoTotalMinutos = null,
      tiempoTecnicoMinutos = null,

      id,
      creadoEn,
      actualizadoEn,
    } = params;

    if (!ticketId) {
      throw new Error('ticketId es requerido para TicketResumen');
    }

    if (intentos <= 0) {
      throw new Error('intentos debe ser al menos 1');
    }

    if (numeroReaperturas < 0) {
      throw new Error('numeroReaperturas no puede ser negativo');
    }

    const now = new Date();

    const props: TicketResumenProps = {
      id,
      ticketId,
      solucionId: solucionId ?? null,

      resueltoComo: resueltoComo?.trim() || null,
      notasInternas: notasInternas?.trim() || null,

      reabierto,
      numeroReaperturas,
      intentos,

      tiempoTotalMinutos: tiempoTotalMinutos ?? null,
      tiempoTecnicoMinutos: tiempoTecnicoMinutos ?? null,

      creadoEn: creadoEn ?? now,
      actualizadoEn: actualizadoEn ?? now,
    };

    return new TicketResumen(props);
  }

  // ========= REHIDRATAR DESDE PRISMA =========
  static fromPrisma(row: TicketResumenRow): TicketResumen {
    return new TicketResumen({
      id: row.id,
      ticketId: row.ticketId,
      solucionId: row.solucionId ?? null,

      resueltoComo: row.resueltoComo ?? null,
      notasInternas: row.notasInternas ?? null,

      reabierto: row.reabierto,
      numeroReaperturas: row.numeroReaperturas,
      intentos: row.intentos,

      tiempoTotalMinutos: row.tiempoTotalMinutos ?? null,
      tiempoTecnicoMinutos: row.tiempoTecnicoMinutos ?? null,

      creadoEn: row.creadoEn,
      actualizadoEn: row.actualizadoEn,
    });
  }

  // ========= GETTERS =========

  get id() {
    return this.props.id;
  }

  get ticketId() {
    return this.props.ticketId;
  }

  get solucionId() {
    return this.props.solucionId;
  }

  get resueltoComo() {
    return this.props.resueltoComo;
  }

  get notasInternas() {
    return this.props.notasInternas;
  }

  get reabierto() {
    return this.props.reabierto;
  }

  get numeroReaperturas() {
    return this.props.numeroReaperturas;
  }

  get intentos() {
    return this.props.intentos;
  }

  get tiempoTotalMinutos() {
    return this.props.tiempoTotalMinutos;
  }

  get tiempoTecnicoMinutos() {
    return this.props.tiempoTecnicoMinutos;
  }

  get creadoEn() {
    return this.props.creadoEn;
  }

  get actualizadoEn() {
    return this.props.actualizadoEn;
  }

  // ========= MÉTODOS DE DOMINIO =========

  /**
   * Marca el ticket como reabierto y aumenta el contador de reaperturas.
   * Si ya estaba reabierto, solo asegura el flag.
   */
  marcarReabierto() {
    if (!this.props.reabierto) {
      this.props.reabierto = true;
      this.props.numeroReaperturas += 1;
      this.touch();
    }
  }

  /**
   * Marca el ticket como definitivamente cerrado (ya no reabierto).
   * No toca número de reaperturas, solo el flag.
   */
  marcarCerradoDefinitivo() {
    if (this.props.reabierto) {
      this.props.reabierto = false;
      this.touch();
    }
  }

  /**
   * Registra un nuevo intento técnico sobre el mismo ticket.
   */
  registrarIntento() {
    this.props.intentos += 1;
    this.touch();
  }

  /**
   * Establece los tiempos calculados en minutos.
   */
  setTiempos(params: {
    tiempoTotalMinutos?: number | null;
    tiempoTecnicoMinutos?: number | null;
  }) {
    const { tiempoTotalMinutos, tiempoTecnicoMinutos } = params;

    if (
      tiempoTotalMinutos !== undefined &&
      tiempoTotalMinutos !== null &&
      tiempoTotalMinutos < 0
    ) {
      throw new Error('tiempoTotalMinutos no puede ser negativo');
    }

    if (
      tiempoTecnicoMinutos !== undefined &&
      tiempoTecnicoMinutos !== null &&
      tiempoTecnicoMinutos < 0
    ) {
      throw new Error('tiempoTecnicoMinutos no puede ser negativo');
    }

    if (tiempoTotalMinutos !== undefined) {
      this.props.tiempoTotalMinutos = tiempoTotalMinutos;
    }

    if (tiempoTecnicoMinutos !== undefined) {
      this.props.tiempoTecnicoMinutos = tiempoTecnicoMinutos;
    }

    this.touch();
  }

  /**
   * Define la solución aplicada y, opcionalmente, el texto descriptivo.
   */
  setSolucion(solucionId: number | null, resueltoComo?: string | null) {
    this.props.solucionId = solucionId;
    if (resueltoComo !== undefined) {
      this.props.resueltoComo = resueltoComo?.trim() || null;
    }
    this.touch();
  }

  /**
   * Actualiza las notas internas para los técnicos / soporte interno.
   */
  setNotasInternas(notas: string | null) {
    this.props.notasInternas = notas?.trim() || null;
    this.touch();
  }

  private touch() {
    this.props.actualizadoEn = new Date();
  }

  // ========= PARA PERSISTENCIA =========

  toObject(): TicketResumenProps {
    return { ...this.props };
  }

  toJSON() {
    return this.toObject();
  }
}
