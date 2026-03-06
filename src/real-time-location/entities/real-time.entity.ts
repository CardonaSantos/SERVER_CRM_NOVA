import { UbicacionActual } from '@prisma/client';
import { Usuario } from 'src/user/entities/user.entity';

export class RealTimeLocation {
  private _latitud: number;
  private _longitud: number;
  private _precision?: number;
  private _velocidad?: number;
  private _bateria?: number;
  private _actualizadoEn?: Date;
  private _usuario?: Usuario;

  private constructor(
    private readonly _usuarioId: number,
    latitud: number,
    longitud: number,
    precision?: number,
    velocidad?: number,
    bateria?: number,
    actualizadoEn?: Date,
    usuario?: Usuario,
  ) {
    this._latitud = latitud;
    this._longitud = longitud;
    this._precision = precision;
    this._velocidad = velocidad;
    this._bateria = bateria;
    this._actualizadoEn = actualizadoEn ?? new Date();
    this._usuario = usuario;
  }

  static create(props: {
    usuarioId: number;
    latitud: number;
    longitud: number;
    precision?: number;
    velocidad?: number;
    bateria?: number;
    actualizadoEn?: Date;
    usuario?: Usuario;
    avatarUrl?: string;
  }): RealTimeLocation {
    return new RealTimeLocation(
      props.usuarioId,
      props.latitud,
      props.longitud,
      props.precision,
      props.velocidad,
      props.bateria,
      props.actualizadoEn,
      props.usuario,
    );
  }

  toJSON() {
    return {
      usuarioId: this.usuarioId,
      latitud: this.latitud,
      longitud: this.longitud,
      precision: this.precision,
      velocidad: this.velocidad,
      bateria: this.bateria,
      actualizadoEn: this.actualizadoEn,
      usuario: this.usuario,
    };
  }

  get usuario() {
    return this._usuario;
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
