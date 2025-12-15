// src/tickets/domain/entities/ticket-soporte.entity.ts
import {
  EstadoTicketSoporte,
  PrioridadTicketSoporte,
  TicketSoporte as TicketSoporteRow,
} from '@prisma/client';

export interface TicketSoporteProps {
  id?: number;

  clienteId: number;
  empresaId: number;
  tecnicoId: number | null;
  creadoPorId: number | null;

  estado: EstadoTicketSoporte;
  prioridad: PrioridadTicketSoporte;

  titulo: string | null;
  descripcion: string | null;

  fechaCierre: Date | null;
  fechaApertura: Date;
  fechaAsignacion: Date | null;
  fechaInicioAtencion: Date | null;
  fechaResolucionTecnico: Date | null;

  creadoEn: Date;
  actualizadoEn: Date;

  fijado: boolean;
}

export class TicketSoporte {
  private constructor(private props: TicketSoporteProps) {}

  // ========= FACTORÍA DE DOMINIO (para crear nuevos tickets) =========
  static create(params: {
    clienteId: number;
    empresaId: number;
    tecnicoId?: number | null;
    creadoPorId?: number | null;

    estado?: EstadoTicketSoporte;
    prioridad?: PrioridadTicketSoporte;

    titulo?: string | null;
    descripcion?: string | null;

    fechaApertura?: Date;
    fijado?: boolean;

    id?: number;
    creadoEn?: Date;
    actualizadoEn?: Date;
  }): TicketSoporte {
    const {
      clienteId,
      empresaId,
      tecnicoId,
      creadoPorId,
      estado,
      prioridad,
      titulo,
      descripcion,
      fechaApertura,
      fijado,
      id,
      creadoEn,
      actualizadoEn,
    } = params;

    if (!clienteId) throw new Error('clienteId es requerido');
    if (!empresaId) throw new Error('empresaId es requerido');

    const now = new Date();

    const props: TicketSoporteProps = {
      id,
      clienteId,
      empresaId,
      tecnicoId: tecnicoId ?? null,
      creadoPorId: creadoPorId ?? null,
      estado: estado ?? EstadoTicketSoporte.ABIERTA,
      prioridad: prioridad ?? PrioridadTicketSoporte.MEDIA,
      titulo: titulo?.trim() || null,
      descripcion: descripcion?.trim() || null,
      fechaCierre: null,
      fechaApertura: fechaApertura ?? now,
      fechaAsignacion: null,
      fechaInicioAtencion: null,
      fechaResolucionTecnico: null,
      creadoEn: creadoEn ?? now,
      actualizadoEn: actualizadoEn ?? now,
      fijado: fijado ?? false,
    };

    return new TicketSoporte(props);
  }

  // ========= REHIDRATAR DESDE PRISMA =========
  //  mapea 1:1 el row de Prisma
  static fromPrisma(row: TicketSoporteRow): TicketSoporte {
    return new TicketSoporte({
      id: row.id,
      clienteId: row.clienteId,
      empresaId: row.empresaId,
      tecnicoId: row.tecnicoId ?? null,
      creadoPorId: row.creadoPorId ?? null,

      estado: row.estado,
      prioridad: row.prioridad,

      titulo: row.titulo ?? null,
      descripcion: row.descripcion ?? null,

      fechaCierre: row.fechaCierre ?? null,
      fechaApertura: row.fechaApertura,
      fechaAsignacion: row.fechaAsignacion ?? null,
      fechaInicioAtencion: row.fechaInicioAtencion ?? null,
      fechaResolucionTecnico: row.fechaResolucionTecnico ?? null,

      creadoEn: row.creadoEn ?? row.fechaApertura,
      actualizadoEn: row.actualizadoEn,

      fijado: row.fijado,
    });
  }

  // ========= GETTERS =========

  get id() {
    return this.props.id;
  }

  get clienteId() {
    return this.props.clienteId;
  }

  get empresaId() {
    return this.props.empresaId;
  }

  get tecnicoId() {
    return this.props.tecnicoId;
  }

  get creadoPorId() {
    return this.props.creadoPorId;
  }

  get estado() {
    return this.props.estado;
  }

  get prioridad() {
    return this.props.prioridad;
  }

  get titulo() {
    return this.props.titulo;
  }

  get descripcion() {
    return this.props.descripcion;
  }

  get fechaCierre() {
    return this.props.fechaCierre;
  }

  get fechaApertura() {
    return this.props.fechaApertura;
  }

  get fechaAsignacion() {
    return this.props.fechaAsignacion;
  }

  get fechaInicioAtencion() {
    return this.props.fechaInicioAtencion;
  }

  get fechaResolucionTecnico() {
    return this.props.fechaResolucionTecnico;
  }

  get creadoEn() {
    return this.props.creadoEn;
  }

  get actualizadoEn() {
    return this.props.actualizadoEn;
  }

  get fijado() {
    return this.props.fijado;
  }

  // ==================

  marcarEnProceso() {
    if (this.props.estado === EstadoTicketSoporte.EN_PROCESO) return;
    this.props.estado = EstadoTicketSoporte.EN_PROCESO;
    this.touch();
  }

  marcarEnRevision() {
    if (this.props.estado === EstadoTicketSoporte.PENDIENTE_REVISION) return;
    this.props.estado = EstadoTicketSoporte.PENDIENTE_REVISION;
    this.touch();
  }

  cerrar() {
    if (this.props.fechaCierre) return;
    this.props.estado = EstadoTicketSoporte.RESUELTA;
    this.props.fechaCierre = new Date();
    this.touch();
  }

  private touch() {
    this.props.actualizadoEn = new Date();
  }

  // ========= PARA PERSISTENCIA =========

  toObject(): TicketSoporteProps {
    return { ...this.props };
  }

  toJSON() {
    return this.toObject();
  }
}
