import { RolUsuario } from '../enums/rol-usuario.enum';

export type UsuarioProps = {
  id: number | null;
  empresaId: number;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: RolUsuario;
  activo: boolean;
  /** Nunca sale del módulo. */
  contrasenaHash: string;
  creadoEn: Date;
  actualizadoEn: Date;
  eliminadoEn: Date | null;
  eliminadoPorId: number | null;
  /** El correo que tenía al eliminarse; `correo` guarda uno reservado. */
  correoEliminado: string | null;
};

export type CrearUsuarioProps = {
  empresaId: number;
  nombre: string;
  correo: string;
  telefono?: string | null;
  rol: RolUsuario;
  contrasenaHash: string;
};

export type ActualizarUsuarioProps = {
  nombre?: string;
  correo?: string;
  telefono?: string | null;
};
