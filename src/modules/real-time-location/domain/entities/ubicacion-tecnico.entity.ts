import {
  CrearUbicacionTecnicoProps,
  UbicacionTecnicoProps,
} from '../props/tecnico-trackin-session.props';

export class UbicacionTecnicoEntity {
  private constructor(private readonly props: UbicacionTecnicoProps) {}

  // FACTORIES

  static create(props: CrearUbicacionTecnicoProps): UbicacionTecnicoEntity {
    const entity = new UbicacionTecnicoEntity({
      tecnicoId: props.tecnicoId,
      sesionTrackingId: props.sesionTrackingId,

      latitud: props.latitud,
      longitud: props.longitud,

      precision: props.precision ?? null,
      velocidad: props.velocidad ?? null,
      bateria: props.bateria ?? null,

      capturadoEn: new Date(props.capturadoEn),

      creadoEn: undefined,
      actualizadoEn: undefined,
    });

    entity.ensureValidBaseProps();

    return entity;
  }

  static hydrate(props: UbicacionTecnicoProps): UbicacionTecnicoEntity {
    const entity = new UbicacionTecnicoEntity({
      ...props,

      capturadoEn: props.capturadoEn ? new Date(props.capturadoEn) : null,

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

  get sesionTrackingId(): number | null | undefined {
    return this.props.sesionTrackingId;
  }

  get latitud(): number {
    return this.props.latitud;
  }

  get longitud(): number {
    return this.props.longitud;
  }

  get precision(): number | null {
    return this.props.precision ?? null;
  }

  get velocidad(): number | null {
    return this.props.velocidad ?? null;
  }

  get bateria(): number | null {
    return this.props.bateria ?? null;
  }

  get capturadoEn(): Date | null {
    return this.props.capturadoEn ? new Date(this.props.capturadoEn) : null;
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

  // SERIALIZATION

  toPrimitives(): UbicacionTecnicoProps {
    return {
      ...this.props,

      capturadoEn: this.props.capturadoEn
        ? new Date(this.props.capturadoEn)
        : null,

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

    if (this.props.sesionTrackingId != null) {
      this.ensurePositiveId(this.props.sesionTrackingId, 'sesionTrackingId');
    }

    this.ensureLatitude(this.props.latitud);

    this.ensureLongitude(this.props.longitud);

    if (this.props.precision != null) {
      this.ensurePrecision(this.props.precision);
    }

    if (this.props.velocidad != null) {
      this.ensureVelocidad(this.props.velocidad);
    }

    if (this.props.bateria != null) {
      this.ensureBateria(this.props.bateria);
    }

    if (this.props.capturadoEn != null) {
      this.ensureValidDate(this.props.capturadoEn, 'capturadoEn');
    }

    if (this.props.creadoEn !== undefined) {
      this.ensureValidDate(this.props.creadoEn, 'creadoEn');
    }

    if (this.props.actualizadoEn !== undefined) {
      this.ensureValidDate(this.props.actualizadoEn, 'actualizadoEn');
    }
  }

  private ensureLatitude(value: number): void {
    if (!Number.isFinite(value) || value < -90 || value > 90) {
      throw new Error('latitud debe ser un valor válido entre -90 y 90.');
    }
  }

  private ensureLongitude(value: number): void {
    if (!Number.isFinite(value) || value < -180 || value > 180) {
      throw new Error('longitud debe ser un valor válido entre -180 y 180.');
    }
  }

  private ensurePrecision(value: number): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error('precision debe ser un número mayor o igual a 0.');
    }
  }

  private ensureVelocidad(value: number): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error('velocidad debe ser un número mayor o igual a 0.');
    }
  }

  private ensureBateria(value: number): void {
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      throw new Error('bateria debe ser un número entero entre 0 y 100.');
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
