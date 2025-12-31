import { NotificacionUsuario as NotificacionUsuarioRow } from '@prisma/client';

export interface NotificacionUsuarioProps {
  id?: number;

  usuarioId: number;
  notificacionId: number;

  leido: boolean;
  leidoEn: Date | null;

  eliminado: boolean;
  eliminadoEn: Date | null;

  recibidoEn: Date;
  fijadoHasta: Date | null;
}

export class NotificacionUsuario {
  private constructor(private props: NotificacionUsuarioProps) {}

  // ========= FACTORÍA DE DOMINIO =========
  static create(params: {
    usuarioId: number;
    notificacionId: number;

    recibidoEn?: Date;

    id?: number;
    leido?: boolean;
    leidoEn?: Date | null;
    eliminado?: boolean;
    eliminadoEn?: Date | null;
    fijadoHasta?: Date | null;
  }): NotificacionUsuario {
    const {
      usuarioId,
      notificacionId,
      recibidoEn,
      id,
      leido,
      leidoEn,
      eliminado,
      eliminadoEn,
      fijadoHasta,
    } = params;

    if (!usuarioId) throw new Error('usuarioId es requerido');
    if (!notificacionId) throw new Error('notificacionId es requerido');

    const now = new Date();

    const props: NotificacionUsuarioProps = {
      id,
      usuarioId,
      notificacionId,

      leido: leido ?? false,
      leidoEn: leidoEn ?? null,

      eliminado: eliminado ?? false,
      eliminadoEn: eliminadoEn ?? null,

      recibidoEn: recibidoEn ?? now,
      fijadoHasta: fijadoHasta ?? null,
    };

    return new NotificacionUsuario(props);
  }

  // ========= REHIDRATAR DESDE PRISMA =========
  static fromPrisma(row: NotificacionUsuarioRow): NotificacionUsuario {
    return new NotificacionUsuario({
      id: row.id,
      usuarioId: row.usuarioId,
      notificacionId: row.notificacionId,

      leido: row.leido,
      leidoEn: row.leidoEn ?? null,

      eliminado: row.eliminado,
      eliminadoEn: row.eliminadoEn ?? null,

      recibidoEn: row.recibidoEn,
      fijadoHasta: row.fijadoHasta ?? null,
    });
  }

  // ========= GETTERS =========

  get id() {
    return this.props.id;
  }

  get usuarioId() {
    return this.props.usuarioId;
  }

  get notificacionId() {
    return this.props.notificacionId;
  }

  get leido() {
    return this.props.leido;
  }

  get eliminado() {
    return this.props.eliminado;
  }

  get recibidoEn() {
    return this.props.recibidoEn;
  }

  get fijadoHasta() {
    return this.props.fijadoHasta;
  }

  // ========= COMPORTAMIENTOS DE DOMINIO =========

  marcarLeida() {
    if (this.props.leido) return;

    this.props.leido = true;
    this.props.leidoEn = new Date();
  }

  marcarNoLeida() {
    if (!this.props.leido) return;

    this.props.leido = false;
    this.props.leidoEn = null;
  }

  eliminar() {
    if (this.props.eliminado) return;

    this.props.eliminado = true;
    this.props.eliminadoEn = new Date();
  }

  restaurar() {
    if (!this.props.eliminado) return;

    this.props.eliminado = false;
    this.props.eliminadoEn = null;
  }

  fijarHasta(fecha: Date) {
    this.props.fijadoHasta = fecha;
  }

  desfijar() {
    this.props.fijadoHasta = null;
  }

  estaFijada(): boolean {
    if (!this.props.fijadoHasta) return false;
    return this.props.fijadoHasta > new Date();
  }

  // ========= PERSISTENCIA =========

  toObject(): NotificacionUsuarioProps {
    return { ...this.props };
  }

  toJSON() {
    return this.toObject();
  }
}
