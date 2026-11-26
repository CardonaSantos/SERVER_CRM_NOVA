import { EstadoTrackingTecnico } from '../enums/estado-tracking-tecnico.enum';
import {
  TrackingDatosInvalidosError,
  TrackingSesionEstadoInvalidoError,
} from '../errors/real-time-location.errors';
import {
  CrearTecnicoTrackingSesionProps,
  TecnicoTrackingSesionProps,
} from '../props/tecnico-tracking-sesion.props';

/**
 * Una sesión de tracking de un técnico (TRACKER ON → OFF). Se cierra una sola
 * vez: FINALIZADA (la apagó el técnico) o EXPIRADA (dejó de reportar y el
 * sistema la cerró en su último heartbeat confiable).
 */
export class TecnicoTrackingSesionEntity {
  private constructor(private readonly props: TecnicoTrackingSesionProps) {}

  static create(
    props: CrearTecnicoTrackingSesionProps,
  ): TecnicoTrackingSesionEntity {
    const iniciadoEn = new Date(props.iniciadoEn);

    const entity = new TecnicoTrackingSesionEntity({
      tecnicoId: props.tecnicoId,
      asistenciaId: props.asistenciaId,
      iniciadoEn,
      finalizadoEn: null,
      ultimoHeartbeatEn: new Date(iniciadoEn),
      estado: EstadoTrackingTecnico.ACTIVA,
      creadoEn: undefined,
      actualizadoEn: undefined,
    });

    entity.ensureValidBaseProps();

    return entity;
  }

  /** Reconstruye desde persistencia: valida consistencia, no reglas de creación. */
  static hydrate(
    props: TecnicoTrackingSesionProps,
  ): TecnicoTrackingSesionEntity {
    const entity = new TecnicoTrackingSesionEntity({
      ...props,
      iniciadoEn: new Date(props.iniciadoEn),
      finalizadoEn: props.finalizadoEn ? new Date(props.finalizadoEn) : null,
      ultimoHeartbeatEn: new Date(props.ultimoHeartbeatEn),
      creadoEn: props.creadoEn ? new Date(props.creadoEn) : undefined,
      actualizadoEn: props.actualizadoEn
        ? new Date(props.actualizadoEn)
        : undefined,
    });

    entity.ensureValidBaseProps();

    return entity;
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get tecnicoId(): number {
    return this.props.tecnicoId;
  }

  get asistenciaId(): number | null | undefined {
    return this.props.asistenciaId;
  }

  get iniciadoEn(): Date {
    return new Date(this.props.iniciadoEn);
  }

  get finalizadoEn(): Date | null {
    return this.props.finalizadoEn ? new Date(this.props.finalizadoEn) : null;
  }

  get ultimoHeartbeatEn(): Date {
    return new Date(this.props.ultimoHeartbeatEn);
  }

  get estado(): EstadoTrackingTecnico {
    return this.props.estado;
  }

  get creadoEn(): Date | undefined {
    return this.props.creadoEn ? new Date(this.props.creadoEn) : undefined;
  }

  get actualizadoEn(): Date | undefined {
    return this.props.actualizadoEn
      ? new Date(this.props.actualizadoEn)
      : undefined;
  }

  get isPersisted(): boolean {
    return typeof this.props.id === 'number';
  }

  get isActiva(): boolean {
    return this.props.estado === EstadoTrackingTecnico.ACTIVA;
  }

  get isFinalizada(): boolean {
    return this.props.estado === EstadoTrackingTecnico.FINALIZADA;
  }

  get isExpirada(): boolean {
    return this.props.estado === EstadoTrackingTecnico.EXPIRADA;
  }

  get estaCerrada(): boolean {
    return this.isFinalizada || this.isExpirada;
  }

  /**
   * Comunicación confirmada con el backend. Es monotónico: un reintento o un
   * evento atrasado nunca hace retroceder el último instante confiable.
   */
  registrarHeartbeat(ocurridoEn: Date): void {
    this.ensurePersisted('registrar heartbeat en');

    if (!this.isActiva) {
      throw new TrackingSesionEstadoInvalidoError(
        'Solo una sesión de tracking activa puede registrar heartbeat.',
      );
    }

    const instante = new Date(ocurridoEn);

    this.ensureValidDate(instante, 'ocurridoEn');

    if (instante.getTime() < this.props.iniciadoEn.getTime()) {
      throw new TrackingDatosInvalidosError(
        'El heartbeat no puede ser anterior al inicio de la sesión.',
      );
    }

    if (instante.getTime() <= this.props.ultimoHeartbeatEn.getTime()) {
      return;
    }

    this.props.ultimoHeartbeatEn = instante;

    this.ensureValidBaseProps();
  }

  /** Apagado por el técnico. Es idempotente: la app puede repetirlo si perdió la respuesta. */
  finalizar(finalizadoEn: Date): void {
    this.ensurePersisted('finalizar');

    if (this.isFinalizada) return;

    if (this.isExpirada) {
      throw new TrackingSesionEstadoInvalidoError(
        'Una sesión de tracking expirada no puede finalizarse manualmente.',
      );
    }

    const instante = new Date(finalizadoEn);

    this.ensureValidDate(instante, 'finalizadoEn');

    if (instante.getTime() < this.props.iniciadoEn.getTime()) {
      throw new TrackingDatosInvalidosError(
        'La fecha de finalización no puede ser anterior al inicio de la sesión.',
      );
    }

    if (instante.getTime() < this.props.ultimoHeartbeatEn.getTime()) {
      throw new TrackingDatosInvalidosError(
        'La fecha de finalización no puede ser anterior al último heartbeat.',
      );
    }

    this.props.estado = EstadoTrackingTecnico.FINALIZADA;
    this.props.finalizadoEn = instante;

    this.ensureValidBaseProps();
  }

  /**
   * El sistema la cierra por falta de actividad. Termina en el último
   * heartbeat confiable, no en el momento en que se detectó. Una sesión ya
   * cerrada no cambia (protege contra la carrera con el apagado manual).
   */
  expirar(): void {
    this.ensurePersisted('expirar');

    if (this.isExpirada || this.isFinalizada) return;

    this.props.estado = EstadoTrackingTecnico.EXPIRADA;
    this.props.finalizadoEn = new Date(this.props.ultimoHeartbeatEn);

    this.ensureValidBaseProps();
  }

  toPrimitives(): TecnicoTrackingSesionProps {
    return {
      ...this.props,
      iniciadoEn: new Date(this.props.iniciadoEn),
      finalizadoEn: this.props.finalizadoEn
        ? new Date(this.props.finalizadoEn)
        : null,
      ultimoHeartbeatEn: new Date(this.props.ultimoHeartbeatEn),
      creadoEn: this.props.creadoEn ? new Date(this.props.creadoEn) : undefined,
      actualizadoEn: this.props.actualizadoEn
        ? new Date(this.props.actualizadoEn)
        : undefined,
    };
  }

  private ensureValidBaseProps(): void {
    if (this.props.id !== undefined) {
      this.ensurePositiveId(this.props.id, 'id');
    }

    this.ensurePositiveId(this.props.tecnicoId, 'tecnicoId');

    if (this.props.asistenciaId != null) {
      this.ensurePositiveId(this.props.asistenciaId, 'asistenciaId');
    }

    this.ensureValidDate(this.props.iniciadoEn, 'iniciadoEn');
    this.ensureValidDate(this.props.ultimoHeartbeatEn, 'ultimoHeartbeatEn');

    if (this.props.finalizadoEn != null) {
      this.ensureValidDate(this.props.finalizadoEn, 'finalizadoEn');
    }

    if (this.props.creadoEn !== undefined) {
      this.ensureValidDate(this.props.creadoEn, 'creadoEn');
    }

    if (this.props.actualizadoEn !== undefined) {
      this.ensureValidDate(this.props.actualizadoEn, 'actualizadoEn');
    }

    if (
      this.props.ultimoHeartbeatEn.getTime() < this.props.iniciadoEn.getTime()
    ) {
      throw new TrackingDatosInvalidosError(
        'El último heartbeat no puede ser anterior al inicio de la sesión.',
      );
    }

    if (
      this.props.finalizadoEn &&
      this.props.finalizadoEn.getTime() < this.props.iniciadoEn.getTime()
    ) {
      throw new TrackingDatosInvalidosError(
        'La fecha de finalización no puede ser anterior al inicio de la sesión.',
      );
    }

    this.ensureValidStateConsistency();
  }

  private ensureValidStateConsistency(): void {
    const { estado, finalizadoEn, ultimoHeartbeatEn } = this.props;

    if (estado === EstadoTrackingTecnico.ACTIVA) {
      if (finalizadoEn != null) {
        throw new TrackingDatosInvalidosError(
          'Una sesión activa no puede tener fecha de finalización.',
        );
      }

      return;
    }

    if (!finalizadoEn) {
      throw new TrackingDatosInvalidosError(
        'Una sesión cerrada debe tener fecha de finalización.',
      );
    }

    if (
      estado === EstadoTrackingTecnico.FINALIZADA &&
      finalizadoEn.getTime() < ultimoHeartbeatEn.getTime()
    ) {
      throw new TrackingDatosInvalidosError(
        'Una sesión finalizada no puede terminar antes de su último heartbeat.',
      );
    }

    // Por definición, una sesión expirada termina en su último heartbeat.
    if (
      estado === EstadoTrackingTecnico.EXPIRADA &&
      finalizadoEn.getTime() !== ultimoHeartbeatEn.getTime()
    ) {
      throw new TrackingDatosInvalidosError(
        'Una sesión expirada debe finalizar en el instante de su último heartbeat.',
      );
    }
  }

  private ensurePersisted(accion: string): void {
    if (!this.isPersisted) {
      throw new TrackingSesionEstadoInvalidoError(
        `No se puede ${accion} una sesión de tracking que aún no ha sido guardada.`,
      );
    }
  }

  private ensurePositiveId(valor: number, campo: string): void {
    if (!Number.isInteger(valor) || valor <= 0) {
      throw new TrackingDatosInvalidosError(
        `El dato ${campo} debe ser un identificador válido.`,
      );
    }
  }

  private ensureValidDate(valor: Date, campo: string): void {
    if (!(valor instanceof Date) || Number.isNaN(valor.getTime())) {
      throw new TrackingDatosInvalidosError(
        `El dato ${campo} debe contener una fecha válida.`,
      );
    }
  }
}
