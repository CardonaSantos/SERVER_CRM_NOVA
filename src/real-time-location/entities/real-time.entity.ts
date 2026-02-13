export class RealTimeLocation {
  private _latitud: number;
  private _longitud: number;
  private _precision?: number;
  private _velocidad?: number;
  private _bateria?: number;
  private _actualizadoEn?: Date;

  private constructor(
    private readonly _usuarioId: number,
    latitud: number,
    longitud: number,
    precision?: number,
    velocidad?: number,
    bateria?: number,
    actualizadoEn?: Date,
  ) {
    this._latitud = latitud;
    this._longitud = longitud;
    this._precision = precision;
    this._velocidad = velocidad;
    this._bateria = bateria;
    this._actualizadoEn = actualizadoEn ?? new Date();
  }

  // 🔹 Factory
  static create(props: {
    usuarioId: number;
    latitud: number;
    longitud: number;
    precision?: number;
    velocidad?: number;
    bateria?: number;
    actualizadoEn?: Date;
  }): RealTimeLocation {
    return new RealTimeLocation(
      props.usuarioId,
      props.latitud,
      props.longitud,
      props.precision,
      props.velocidad,
      props.bateria,
      props.actualizadoEn,
    );
  }

  // 🔹 Getters
  get usuarioId() {
    return this._usuarioId;
  }

  get latitud() {
    return this._latitud;
  }

  get longitud() {
    return this._longitud;
  }

  get precision() {
    return this._precision;
  }

  get velocidad() {
    return this._velocidad;
  }

  get bateria() {
    return this._bateria;
  }

  get actualizadoEn() {
    return this._actualizadoEn;
  }

  // 🔹 Método de negocio
  updateLocation(
    latitud: number,
    longitud: number,
    precision?: number,
    velocidad?: number,
    bateria?: number,
  ) {
    this._latitud = latitud;
    this._longitud = longitud;
    this._precision = precision;
    this._velocidad = velocidad;
    this._bateria = bateria;
    this._actualizadoEn = new Date();
  }
}
