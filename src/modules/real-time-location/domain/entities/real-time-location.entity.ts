import { EstadoTrackingTecnico } from '../enums/estado-tracking-tecnico.enum';
import {
  CrearTecnicoTrackingSesionProps,
  FinalizarTecnicoTrackingParams,
  RegistrarHeartbeatTrackingParams,
  TecnicoTrackingSesionProps,
} from '../props/entities-props.props';

export class TecnicoTrackingSesionEntity {
  private constructor(private readonly props: TecnicoTrackingSesionProps) {}

  // FACTORIES

  static create(
    props: CrearTecnicoTrackingSesionProps,
  ): TecnicoTrackingSesionEntity {
    const iniciadoEn = props.iniciadoEn
      ? new Date(props.iniciadoEn)
      : new Date();

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

  // GETTERS

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

  // ESTADO DERIVADO

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

  // DOMAIN METHODS

  registrarHeartbeat(params: RegistrarHeartbeatTrackingParams = {}): void {
    this.ensurePersisted('registrar heartbeat en');

    if (!this.isActiva) {
      throw new Error(
        'Solo una sesión de tracking activa puede registrar heartbeat.',
      );
    }

    const ocurridoEn = params.ocurridoEn
      ? new Date(params.ocurridoEn)
      : new Date();

    this.ensureValidDate(ocurridoEn, 'ocurridoEn');

    if (ocurridoEn.getTime() < this.props.iniciadoEn.getTime()) {
      throw new Error(
        'El heartbeat no puede ser anterior al inicio de la sesión.',
      );
    }

    /*
     * Los heartbeats son monotónicos.
     *
     * Si llega un retry o un evento atrasado, nunca hacemos
     * retroceder el último instante confiable.
     */
    if (ocurridoEn.getTime() <= this.props.ultimoHeartbeatEn.getTime()) {
      return;
    }

    this.props.ultimoHeartbeatEn = ocurridoEn;

    this.ensureValidBaseProps();
  }

  finalizar(params: FinalizarTecnicoTrackingParams = {}): void {
    this.ensurePersisted('finalizar');

    /*
     * Finalizar debe ser idempotente.
     *
     * Esto permite que la APK repita la solicitud
     * cuando perdió la respuesta HTTP anterior.
     */
    if (this.isFinalizada) {
      return;
    }

    if (this.isExpirada) {
      throw new Error(
        'Una sesión de tracking expirada no puede finalizarse manualmente.',
      );
    }

    const finalizadoEn = params.finalizadoEn
      ? new Date(params.finalizadoEn)
      : new Date();

    this.ensureValidDate(finalizadoEn, 'finalizadoEn');

    if (finalizadoEn.getTime() < this.props.iniciadoEn.getTime()) {
      throw new Error(
        'La fecha de finalización no puede ser anterior al inicio de la sesión.',
      );
    }

    if (finalizadoEn.getTime() < this.props.ultimoHeartbeatEn.getTime()) {
      throw new Error(
        'La fecha de finalización no puede ser anterior al último heartbeat.',
      );
    }

    this.props.estado = EstadoTrackingTecnico.FINALIZADA;
    this.props.finalizadoEn = finalizadoEn;

    this.ensureValidBaseProps();
  }

  expirar(): void {
    this.ensurePersisted('expirar');

    /*
     * Una sesión ya expirada no requiere ninguna acción.
     */
    if (this.isExpirada) {
      return;
    }

    /*
     * Una sesión finalizada correctamente nunca debe
     * transformarse posteriormente en EXPIRADA.
     *
     * Esto también protege contra carreras entre el
     * cierre manual y el proceso que busca sesiones stale.
     */
    if (this.isFinalizada) {
      return;
    }

    this.props.estado = EstadoTrackingTecnico.EXPIRADA;

    /*
     * Regla fundamental:
     *
     * una expiración finaliza en el último instante
     * confiable conocido, NO en el momento en que el
     * backend detectó posteriormente la expiración.
     */
    this.props.finalizadoEn = new Date(this.props.ultimoHeartbeatEn);

    this.ensureValidBaseProps();
  }

  // SERIALIZATION

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

  // INVARIANTS

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
      throw new Error(
        'El último heartbeat no puede ser anterior al inicio de la sesión.',
      );
    }

    if (
      this.props.finalizadoEn &&
      this.props.finalizadoEn.getTime() < this.props.iniciadoEn.getTime()
    ) {
      throw new Error(
        'La fecha de finalización no puede ser anterior al inicio de la sesión.',
      );
    }

    this.ensureValidStateConsistency();
  }

  private ensureValidStateConsistency(): void {
    switch (this.props.estado) {
      case EstadoTrackingTecnico.ACTIVA: {
        if (this.props.finalizadoEn != null) {
          throw new Error(
            'Una sesión activa no puede tener fecha de finalización.',
          );
        }

        return;
      }

      case EstadoTrackingTecnico.FINALIZADA: {
        if (!this.props.finalizadoEn) {
          throw new Error(
            'Una sesión finalizada debe tener fecha de finalización.',
          );
        }

        if (
          this.props.finalizadoEn.getTime() <
          this.props.ultimoHeartbeatEn.getTime()
        ) {
          throw new Error(
            'Una sesión finalizada no puede terminar antes de su último heartbeat.',
          );
        }

        return;
      }

      case EstadoTrackingTecnico.EXPIRADA: {
        if (!this.props.finalizadoEn) {
          throw new Error(
            'Una sesión expirada debe tener fecha de finalización.',
          );
        }

        /*
         * Por definición de negocio, una sesión expirada
         * termina exactamente en el último heartbeat
         * confiable conocido.
         */
        if (
          this.props.finalizadoEn.getTime() !==
          this.props.ultimoHeartbeatEn.getTime()
        ) {
          throw new Error(
            'Una sesión expirada debe finalizar en el instante de su último heartbeat.',
          );
        }

        return;
      }

      default: {
        throw new Error('El estado de la sesión de tracking no es válido.');
      }
    }
  }

  private ensurePersisted(action: string): void {
    if (!this.isPersisted) {
      throw new Error(
        `No se puede ${action} una sesión de tracking que aún no ha sido guardada.`,
      );
    }
  }

  private ensurePositiveId(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un identificador válido.`);
    }
  }

  private ensureValidDate(value: Date, field: string): void {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new Error(`${field} debe contener una fecha válida.`);
    }
  }
}
