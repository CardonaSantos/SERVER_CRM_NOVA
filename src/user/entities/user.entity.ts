// src/usuarios/domain/entities/usuario.entity.ts
import { RolUsuario, Usuario as UsuarioRow } from '@prisma/client';

export interface UsuarioProps {
  id?: number;

  empresaId: number;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: RolUsuario;
  activo: boolean;

  contrasena: string; // normalmente ya hashed

  creadoEn: Date;
  actualizadoEn: Date;
}

export class Usuario {
  private constructor(private props: UsuarioProps) {}
  // ========= FACTORÍA PARA NUEVOS USUARIOS =========
  static create(params: {
    empresaId: number;
    nombre: string;
    correo: string;
    contrasena: string; // hashed o plano, pero el dominio no sabe de bcrypt
    rol: RolUsuario;
    telefono?: string | null;
    activo?: boolean;
    id?: number;
    creadoEn?: Date;
    actualizadoEn?: Date;
  }): Usuario {
    const {
      empresaId,
      nombre,
      correo,
      contrasena,
      rol,
      telefono,
      activo = true,
      id,
      creadoEn,
      actualizadoEn,
    } = params;

    if (!empresaId) throw new Error('empresaId es requerido');
    if (!nombre?.trim()) throw new Error('nombre es requerido');
    if (!correo?.trim()) throw new Error('correo es requerido');
    if (!contrasena?.trim()) throw new Error('contrasena es requerida');

    const now = new Date();

    const props: UsuarioProps = {
      id,
      empresaId,
      nombre: nombre.trim(),
      correo: correo.trim().toLowerCase(),
      telefono: telefono?.trim() ?? null,
      rol,
      activo,
      contrasena,
      creadoEn: creadoEn ?? now,
      actualizadoEn: actualizadoEn ?? now,
    };

    return new Usuario(props);
  }

  // ========= REHIDRATAR DESDE PRISMA =========
  static fromPrisma(row: UsuarioRow): Usuario {
    return new Usuario({
      id: row.id,
      empresaId: row.empresaId,
      nombre: row.nombre,
      correo: row.correo,
      telefono: row.telefono ?? null,
      rol: row.rol,
      activo: row.activo,
      contrasena: row.contrasena,
      creadoEn: row.creadoEn,
      actualizadoEn: row.actualizadoEn,
    });
  }

  // ========= GETTERS =========
  get id() {
    return this.props.id!;
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

  get creadoEn() {
    return this.props.creadoEn;
  }

  get actualizadoEn() {
    return this.props.actualizadoEn;
  }

  get contrasena() {
    return this.props.contrasena;
  }

  // ========= MÉTODOS DE DOMINIO =========

  actualizarDatosBasicos(params: {
    nombre?: string;
    correo?: string;
    telefono?: string | null;
  }) {
    const { nombre, correo, telefono } = params;

    if (nombre !== undefined) {
      if (!nombre.trim()) throw new Error('nombre no puede ser vacío');
      this.props.nombre = nombre.trim();
    }

    if (correo !== undefined) {
      if (!correo.trim()) throw new Error('correo no puede ser vacío');
      this.props.correo = correo.trim().toLowerCase();
    }

    if (telefono !== undefined) {
      this.props.telefono = telefono?.trim() ?? null;
    }

    this.touch();
  }

  cambiarRol(rol: RolUsuario) {
    this.props.rol = rol;
    this.touch();
  }

  activar() {
    if (!this.props.activo) {
      this.props.activo = true;
      this.touch();
    }
  }

  desactivar() {
    if (this.props.activo) {
      this.props.activo = false;
      this.touch();
    }
  }

  cambiarContrasena(hash: string) {
    if (!hash?.trim()) {
      throw new Error('La nueva contraseña no puede ser vacía');
    }
    this.props.contrasena = hash;
    this.touch();
  }

  private touch() {
    this.props.actualizadoEn = new Date();
  }

  // ========= PARA PERSISTENCIA / SERIALIZACIÓN =========

  toObject(): UsuarioProps {
    return { ...this.props };
  }

  toJSON() {
    return this.toObject();
  }
}
