import { EstadoUsuario } from '../enums/estado-usuario.enum';
import { RolUsuario } from '../enums/rol-usuario.enum';
import {
  UsuarioEliminadoError,
  UsuarioInvalidoError,
  UsuarioNoEliminadoError,
} from '../errors/usuario.errors';
import {
  correoReservado,
  estadoDe,
  normalizarCorreo,
  normalizarNombre,
  normalizarTelefono,
} from '../policies/datos-usuario.policy';
import {
  ActualizarUsuarioProps,
  CrearUsuarioProps,
  UsuarioProps,
} from '../props/usuario.props';

/** Cuenta de una persona que entra al CRM. Nunca se borra de la base. */
export class UsuarioEntity {
  private constructor(private props: UsuarioProps) {}

  /** Nace activo. La contraseña llega ya codificada. */
  static create(input: CrearUsuarioProps, ahora: Date): UsuarioEntity {
    if (!input.contrasenaHash) {
      throw new UsuarioInvalidoError('La contraseña es obligatoria.');
    }

    return new UsuarioEntity({
      id: null,
      empresaId: input.empresaId,
      nombre: normalizarNombre(input.nombre),
      correo: normalizarCorreo(input.correo),
      telefono: normalizarTelefono(input.telefono),
      rol: input.rol,
      activo: true,
      contrasenaHash: input.contrasenaHash,
      creadoEn: ahora,
      actualizadoEn: ahora,
      eliminadoEn: null,
      eliminadoPorId: null,
      correoEliminado: null,
    });
  }

  /** Reconstruye desde persistencia sin imponer reglas nuevas a filas antiguas. */
  static hydrate(props: UsuarioProps): UsuarioEntity {
    if (props.id === null) {
      throw new UsuarioInvalidoError('El usuario no tiene identificador.');
    }

    return new UsuarioEntity({ ...props });
  }

  asegurarVigente(): void {
    if (this.props.eliminadoEn) throw new UsuarioEliminadoError();
  }

  /** @returns `false` si no cambió nada. */
  actualizarDatos(cambios: ActualizarUsuarioProps, fecha: Date): boolean {
    this.asegurarVigente();

    // Todo se valida antes de cambiar algo.
    const siguiente = {
      nombre:
        cambios.nombre === undefined
          ? this.props.nombre
          : normalizarNombre(cambios.nombre),
      correo:
        cambios.correo === undefined
          ? this.props.correo
          : normalizarCorreo(cambios.correo),
      telefono:
        cambios.telefono === undefined
          ? this.props.telefono
          : normalizarTelefono(cambios.telefono),
    };
    const cambio =
      siguiente.nombre !== this.props.nombre ||
      siguiente.correo !== this.props.correo ||
      siguiente.telefono !== this.props.telefono;
    if (!cambio) return false;

    this.props = { ...this.props, ...siguiente, actualizadoEn: fecha };
    return true;
  }

  /** @returns `false` si ya tenía ese rol. */
  cambiarRol(rol: RolUsuario, fecha: Date): boolean {
    this.asegurarVigente();
    if (rol === this.props.rol) return false;

    this.props = { ...this.props, rol, actualizadoEn: fecha };
    return true;
  }

  /** @returns `false` si ya estaba activo. */
  activar(fecha: Date): boolean {
    this.asegurarVigente();
    if (this.props.activo) return false;

    this.props = { ...this.props, activo: true, actualizadoEn: fecha };
    return true;
  }

  /** @returns `false` si ya estaba inactivo. */
  desactivar(fecha: Date): boolean {
    this.asegurarVigente();
    if (!this.props.activo) return false;

    this.props = { ...this.props, activo: false, actualizadoEn: fecha };
    return true;
  }

  cambiarContrasena(contrasenaHash: string, fecha: Date): void {
    this.asegurarVigente();
    if (!contrasenaHash) {
      throw new UsuarioInvalidoError('La contraseña es obligatoria.');
    }

    this.props = { ...this.props, contrasenaHash, actualizadoEn: fecha };
  }

  /**
   * Borrado lógico: queda inactivo y su correo pasa a `correoEliminado`, así
   * el correo real puede usarse en otra cuenta. Lo que registró se conserva.
   */
  eliminar(usuarioId: number, fecha: Date): void {
    this.asegurarVigente();

    this.props = {
      ...this.props,
      activo: false,
      correoEliminado: this.props.correo,
      correo: correoReservado(this.props.id!),
      eliminadoEn: fecha,
      eliminadoPorId: usuarioId,
      actualizadoEn: fecha,
    };
  }

  /** Vuelve desactivado: se activa aparte. `correo` puede ser otro si el suyo ya se usa. */
  restaurar(correo: string, fecha: Date): void {
    if (!this.props.eliminadoEn) throw new UsuarioNoEliminadoError();

    this.props = {
      ...this.props,
      correo: normalizarCorreo(correo),
      correoEliminado: null,
      activo: false,
      eliminadoEn: null,
      eliminadoPorId: null,
      actualizadoEn: fecha,
    };
  }

  get id(): number | null {
    return this.props.id;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  get correo(): string {
    return this.props.correo;
  }

  /** El correo real aunque esté eliminado. */
  get correoOriginal(): string {
    return this.props.correoEliminado ?? this.props.correo;
  }

  get rol(): RolUsuario {
    return this.props.rol;
  }

  get activo(): boolean {
    return this.props.activo;
  }

  get eliminado(): boolean {
    return this.props.eliminadoEn !== null;
  }

  get estado(): EstadoUsuario {
    return estadoDe(this.props);
  }

  get contrasenaHash(): string {
    return this.props.contrasenaHash;
  }

  toPrimitives(): UsuarioProps {
    return {
      ...this.props,
      creadoEn: new Date(this.props.creadoEn),
      actualizadoEn: new Date(this.props.actualizadoEn),
      eliminadoEn: this.props.eliminadoEn
        ? new Date(this.props.eliminadoEn)
        : null,
    };
  }
}
