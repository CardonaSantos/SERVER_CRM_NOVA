import {
  AudienciaNotificacion,
  CategoriaNotificacion,
  SeveridadNotificacion,
  Notificacion as NotificacionRow,
} from '@prisma/client';

export interface NotificacionProps {
  id?: number;

  empresaId: number | null;
  remitenteId: number | null;

  titulo: string | null;
  mensaje: string;
  categoria: CategoriaNotificacion;
  subtipo: string | null;
  severidad: SeveridadNotificacion;

  url: string | null;

  referenciaTipo: string | null;
  referenciaId: number | null;

  route: string | null;
  actionLabel: string | null;

  audiencia: AudienciaNotificacion;

  fechaCreacion: Date;
  visibleDesde: Date | null;
  expiraEn: Date | null;
  programadaEn: Date | null;
}

export class Notificacion {
  private constructor(private props: NotificacionProps) {}

  // ========= FACTORÍA DE DOMINIO =========
  static create(params: {
    empresaId?: number | null;
    remitenteId?: number | null;

    titulo?: string | null;
    mensaje: string;

    categoria?: CategoriaNotificacion;
    subtipo?: string | null;
    severidad?: SeveridadNotificacion;

    url?: string | null;

    referenciaTipo?: string | null;
    referenciaId?: number | null;

    route?: string | null;
    actionLabel?: string | null;

    audiencia?: AudienciaNotificacion;

    visibleDesde?: Date | null;
    expiraEn?: Date | null;
    programadaEn?: Date | null;

    id?: number;
    fechaCreacion?: Date;
  }): Notificacion {
    const {
      empresaId,
      remitenteId,
      titulo,
      mensaje,
      categoria,
      subtipo,
      severidad,
      url,
      referenciaTipo,
      referenciaId,
      route,
      actionLabel,
      audiencia,
      visibleDesde,
      expiraEn,
      programadaEn,
      id,
      fechaCreacion,
    } = params;

    if (!mensaje || !mensaje.trim()) {
      throw new Error('mensaje es requerido');
    }

    const now = new Date();

    const props: NotificacionProps = {
      id,
      empresaId: empresaId ?? null,
      remitenteId: remitenteId ?? null,

      titulo: titulo?.trim() || null,
      mensaje: mensaje.trim(),

      categoria: categoria ?? CategoriaNotificacion.OTROS,
      subtipo: subtipo ?? null,
      severidad: severidad ?? SeveridadNotificacion.INFO,

      url: url ?? null,

      referenciaTipo: referenciaTipo ?? null,
      referenciaId: referenciaId ?? null,

      route: route ?? null,
      actionLabel: actionLabel ?? null,

      audiencia: audiencia ?? AudienciaNotificacion.USUARIOS,

      fechaCreacion: fechaCreacion ?? now,
      visibleDesde: visibleDesde ?? null,
      expiraEn: expiraEn ?? null,
      programadaEn: programadaEn ?? null,
    };

    return new Notificacion(props);
  }

  update(params: {
    titulo?: string | null;
    mensaje?: string;
    categoria?: CategoriaNotificacion;
    severidad?: SeveridadNotificacion;
    url?: string | null;
    route?: string | null;
    actionLabel?: string | null;
    visibleDesde?: Date | null;
    expiraEn?: Date | null;
    programadaEn?: Date | null;
  }) {
    if (params.mensaje !== undefined) {
      if (!params.mensaje || !params.mensaje.trim())
        throw new Error('El mensaje no puede estar vacío');
      this.props.mensaje = params.mensaje.trim();
    }

    if (params.titulo !== undefined) this.props.titulo = params.titulo;
    if (params.categoria !== undefined) this.props.categoria = params.categoria;
    if (params.severidad !== undefined) this.props.severidad = params.severidad;
    if (params.url !== undefined) this.props.url = params.url;
    if (params.route !== undefined) this.props.route = params.route;
    if (params.actionLabel !== undefined)
      this.props.actionLabel = params.actionLabel;

    if (params.visibleDesde !== undefined)
      this.props.visibleDesde = params.visibleDesde;
    if (params.expiraEn !== undefined) this.props.expiraEn = params.expiraEn;
    if (params.programadaEn !== undefined)
      this.props.programadaEn = params.programadaEn;
  }

  // ========= REHIDRATACIÓN DESDE PRISMA =========
  static fromPrisma(row: NotificacionRow): Notificacion {
    return new Notificacion({
      id: row.id,
      empresaId: row.empresaId ?? null,
      remitenteId: row.remitenteId ?? null,

      titulo: row.titulo ?? null,
      mensaje: row.mensaje,

      categoria: row.categoria,
      subtipo: row.subtipo ?? null,
      severidad: row.severidad,

      url: row.url ?? null,

      referenciaTipo: row.referenciaTipo ?? null,
      referenciaId: row.referenciaId ?? null,

      route: row.route ?? null,
      actionLabel: row.actionLabel ?? null,

      audiencia: row.audiencia,

      fechaCreacion: row.fechaCreacion,
      visibleDesde: row.visibleDesde ?? null,
      expiraEn: row.expiraEn ?? null,
      programadaEn: row.programadaEn ?? null,
    });
  }

  // ========= GETTERS =========

  get id() {
    return this.props.id;
  }

  get empresaId() {
    return this.props.empresaId;
  }

  get remitenteId() {
    return this.props.remitenteId;
  }

  get titulo() {
    return this.props.titulo;
  }

  get mensaje() {
    return this.props.mensaje;
  }

  get categoria() {
    return this.props.categoria;
  }

  get subtipo() {
    return this.props.subtipo;
  }

  get severidad() {
    return this.props.severidad;
  }

  get audiencia() {
    return this.props.audiencia;
  }

  get referenciaTipo() {
    return this.props.referenciaTipo;
  }

  get referenciaId() {
    return this.props.referenciaId;
  }

  get route() {
    return this.props.route;
  }

  get actionLabel() {
    return this.props.actionLabel;
  }

  get fechaCreacion() {
    return this.props.fechaCreacion;
  }

  get visibleDesde() {
    return this.props.visibleDesde;
  }

  get expiraEn() {
    return this.props.expiraEn;
  }

  // ========= COMPORTAMIENTOS DE DOMINIO =========

  esVisibleAhora(): boolean {
    const now = new Date();
    if (this.props.visibleDesde && this.props.visibleDesde > now) return false;
    if (this.props.expiraEn && this.props.expiraEn < now) return false;
    return true;
  }

  expirar() {
    this.props.expiraEn = new Date();
  }

  programarPara(fecha: Date) {
    this.props.programadaEn = fecha;
  }

  // ========= PERSISTENCIA =========

  toObject(): NotificacionProps {
    return { ...this.props };
  }
  toPersistence(): NotificacionProps {
    return { ...this.props };
  }

  toJSON() {
    return this.toObject();
  }
}
