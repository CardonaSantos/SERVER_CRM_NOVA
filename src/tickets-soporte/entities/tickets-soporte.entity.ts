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

  tiempoTotalMinutos?: number;
}

export class TicketSoporte {
  private constructor(private props: TicketSoporteProps) {}

  // ========= FACTORÍA DE DOMINIO =========

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

    tiempoTotalMinutos?: number | null;
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
      tiempoTotalMinutos,
    } = params;

    if (!clienteId) {
      throw new Error('clienteId es requerido');
    }

    if (!empresaId) {
      throw new Error('empresaId es requerido');
    }

    const now = new Date();

    const tecnicoPrincipalId = tecnicoId ?? null;

    const props: TicketSoporteProps = {
      id,

      clienteId,
      empresaId,

      tecnicoId: tecnicoPrincipalId,
      creadoPorId: creadoPorId ?? null,

      estado: estado ?? EstadoTicketSoporte.ABIERTA,
      prioridad: prioridad ?? PrioridadTicketSoporte.MEDIA,

      titulo: titulo?.trim() || null,
      descripcion: descripcion?.trim() || null,

      fechaApertura: fechaApertura
        ? TicketSoporte.cloneValidDate(fechaApertura, 'fechaApertura')
        : now,

      /*
       * Si el ticket nace con un técnico principal,
       * ya existe una primera asignación.
       *
       * Los técnicos adicionales se gestionan fuera
       * de esta entidad y el service completará este
       * mismo dato cuando corresponda.
       */
      fechaAsignacion: tecnicoPrincipalId ? now : null,

      fechaInicioAtencion: null,
      fechaResolucionTecnico: null,
      fechaCierre: null,

      creadoEn: creadoEn
        ? TicketSoporte.cloneValidDate(creadoEn, 'creadoEn')
        : now,

      actualizadoEn: actualizadoEn
        ? TicketSoporte.cloneValidDate(actualizadoEn, 'actualizadoEn')
        : now,

      fijado: fijado ?? false,

      tiempoTotalMinutos: tiempoTotalMinutos ?? undefined,
    };

    return new TicketSoporte(props);
  }

  // ========= REHIDRATAR DESDE PRISMA =========

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

  // ========= CICLO DEL TICKET =========

  /**
   * Registra la primera vez que el ticket recibió
   * al menos un técnico.
   *
   * Una reasignación posterior NO modifica esta fecha.
   */
  registrarPrimeraAsignacion(fecha: Date = new Date()): void {
    if (this.props.fechaAsignacion) {
      return;
    }

    const fechaAsignacion = TicketSoporte.cloneValidDate(
      fecha,
      'fechaAsignacion',
    );

    this.props.fechaAsignacion = fechaAsignacion;

    this.touch(fechaAsignacion);
  }

  /**
   * Inicia o reanuda el trabajo técnico.
   *
   * fechaInicioAtencion representa exclusivamente
   * la PRIMERA atención del ticket, por lo que una
   * reanudación posterior no debe sobrescribirla.
   *
   * Los distintos ciclos activos se conservan en
   * TicketTimeLog.
   */
  marcarEnProceso(fecha: Date = new Date()): void {
    if (this.props.estado === EstadoTicketSoporte.EN_PROCESO) {
      return;
    }

    const fechaInicio = TicketSoporte.cloneValidDate(
      fecha,
      'fechaInicioAtencion',
    );

    this.props.estado = EstadoTicketSoporte.EN_PROCESO;

    if (!this.props.fechaInicioAtencion) {
      this.props.fechaInicioAtencion = fechaInicio;
    }

    this.touch(fechaInicio);
  }

  /**
   * Finaliza el ciclo técnico actual y deja el ticket
   * pendiente de revisión.
   *
   * A diferencia de fechaInicioAtencion, esta fecha sí
   * se actualiza si el ticket vuelve a trabajo técnico
   * y posteriormente se entrega nuevamente a revisión.
   *
   * De esta forma representa la resolución técnica
   * más reciente.
   */
  marcarEnRevision(fecha: Date = new Date()): void {
    if (this.props.estado === EstadoTicketSoporte.PENDIENTE_REVISION) {
      return;
    }

    const fechaResolucion = TicketSoporte.cloneValidDate(
      fecha,
      'fechaResolucionTecnico',
    );

    this.props.estado = EstadoTicketSoporte.PENDIENTE_REVISION;
    this.props.fechaResolucionTecnico = fechaResolucion;

    this.touch(fechaResolucion);
  }

  /**
   * Cierra el ticket.
   *
   * fechaCierre representa exclusivamente el cierre
   * final y nunca debe modificar fechaResolucionTecnico.
   */
  cerrar(fecha: Date = new Date()): void {
    if (this.props.fechaCierre) {
      return;
    }

    const fechaCierre = TicketSoporte.cloneValidDate(fecha, 'fechaCierre');

    this.props.estado = EstadoTicketSoporte.RESUELTA;
    this.props.fechaCierre = fechaCierre;

    this.touch(fechaCierre);
  }

  // ========= HELPERS =========

  private touch(fecha: Date = new Date()): void {
    this.props.actualizadoEn = new Date(fecha);
  }

  private static cloneValidDate(fecha: Date, field: string): Date {
    const value = new Date(fecha);

    if (Number.isNaN(value.getTime())) {
      throw new Error(`${field} debe contener una fecha válida`);
    }

    return value;
  }

  // ========= PARA PERSISTENCIA =========

  toObject(): TicketSoporteProps {
    return { ...this.props };
  }

  toJSON() {
    return this.toObject();
  }
}
