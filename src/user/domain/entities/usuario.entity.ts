import { RolUsuario } from '@prisma/client';

export interface UsuarioProps {
  id?: number;
  empresaId: number;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: RolUsuario;
  activo: boolean;
  contrasena: string;
  creadoEn: Date;
  actualizadoEn: Date;
}

export interface UsuarioPublico {
  id: number;
  empresaId: number;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: RolUsuario;
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}

export interface UsuarioEliminado extends UsuarioPublico {}

export class Usuario {
  private constructor(private props: UsuarioProps) {}

  static create(params: {
    empresaId: number;
    nombre: string;
    correo: string;
    contrasena: string;
    rol: RolUsuario;
    telefono?: string | null;
    activo?: boolean;
  }): Usuario {
    const now = new Date();

    if (!Number.isInteger(params.empresaId) || params.empresaId <= 0) {
      throw new Error('empresaId es requerido');
    }
    if (!params.nombre?.trim()) throw new Error('nombre es requerido');
    if (!params.correo?.trim()) throw new Error('correo es requerido');
    if (!params.contrasena?.trim()) throw new Error('contrasena es requerida');

    return new Usuario({
      empresaId: params.empresaId,
      nombre: params.nombre.trim(),
      correo: params.correo.trim().toLowerCase(),
      telefono: Usuario.normalizeTelefono(params.telefono),
      rol: params.rol,
      activo: params.activo ?? true,
      contrasena: params.contrasena,
      creadoEn: now,
      actualizadoEn: now,
    });
  }

  static rehydrate(props: UsuarioProps): Usuario {
    return new Usuario({ ...props });
  }

  get id(): number {
    if (this.props.id === undefined) {
      throw new Error('Usuario todavía no tiene id persistido');
    }
    return this.props.id;
  }

  get empresaId() {
    return this.props.empresaId;
  }

  get nombre() {
    return this.props.nombre;
  }

  get correo() {
    return this.props.correo;
  }

  get telefono() {
    return this.props.telefono;
  }

  get rol() {
    return this.props.rol;
  }

  get activo() {
    return this.props.activo;
  }

  get contrasena() {
    return this.props.contrasena;
  }

  get creadoEn() {
    return this.props.creadoEn;
  }

  get actualizadoEn() {
    return this.props.actualizadoEn;
  }

  actualizarDatosBasicos(params: {
    nombre?: string;
    correo?: string;
    telefono?: string | null;
  }) {
    this.assertDisponible();

    if (params.nombre !== undefined) {
      if (!params.nombre.trim()) throw new Error('nombre no puede ser vacío');
      this.props.nombre = params.nombre.trim();
    }

    if (params.correo !== undefined) {
      if (!params.correo.trim()) throw new Error('correo no puede ser vacío');
      this.props.correo = params.correo.trim().toLowerCase();
    }

    if (params.telefono !== undefined) {
      this.props.telefono = Usuario.normalizeTelefono(params.telefono);
    }

    this.touch();
  }

  cambiarRol(rol: RolUsuario) {
    this.assertDisponible();
    this.props.rol = rol;
    this.touch();
  }

  activar() {
    this.assertDisponible();
    if (!this.props.activo) {
      this.props.activo = true;
      this.touch();
    }
  }

  desactivar() {
    this.assertDisponible();
    if (this.props.activo) {
      this.props.activo = false;
      this.touch();
    }
  }

  cambiarContrasena(hash: string) {
    this.assertDisponible();
    if (!hash?.trim())
      throw new Error('La nueva contraseña no puede ser vacía');
    this.props.contrasena = hash;
    this.touch();
  }

  toObject(): UsuarioProps {
    return { ...this.props };
  }

  toPublicObject(): UsuarioPublico {
    return {
      id: this.id,
      empresaId: this.props.empresaId,
      nombre: this.props.nombre,
      correo: this.props.correo,
      telefono: this.props.telefono,
      rol: this.props.rol,
      activo: this.props.activo,
      creadoEn: this.props.creadoEn,
      actualizadoEn: this.props.actualizadoEn,
    };
  }

  toDeletedObject(): UsuarioEliminado {
    return {
      ...this.toPublicObject(),
    };
  }

  private assertDisponible() {}

  private touch() {
    this.props.actualizadoEn = new Date();
  }

  private static normalizeTelefono(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
