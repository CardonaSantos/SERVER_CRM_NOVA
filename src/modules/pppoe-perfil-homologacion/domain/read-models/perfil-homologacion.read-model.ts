import { PerfilHomologacionEntity } from '../entities/perfil-homologacion.entity';

/** Foto de solo lectura de una homologación persistida. */
export type PerfilHomologacionReadModel = {
  id: number;
  empresaId: number;
  mikrotikRouterId: number;
  servicioInternetId: number;
  codigoPerfil: string;
  activo: boolean;
  creadoPorId: number | null;
  actualizadoPorId: number | null;
  creadoEn: Date;
  actualizadoEn: Date;
};

export function aPerfilHomologacionReadModel(
  entity: PerfilHomologacionEntity,
): PerfilHomologacionReadModel {
  const p = entity.toPrimitives();

  if (p.id === null) {
    throw new Error('Una homologación sin id no está persistida.');
  }

  return {
    id: p.id,
    empresaId: p.empresaId,
    mikrotikRouterId: p.mikrotikRouterId,
    servicioInternetId: p.servicioInternetId,
    codigoPerfil: p.codigoPerfil,
    activo: p.activo,
    creadoPorId: p.creadoPorId,
    actualizadoPorId: p.actualizadoPorId,
    creadoEn: new Date(p.creadoEn),
    actualizadoEn: new Date(p.actualizadoEn),
  };
}

export type PerfilHomologacionUsuarioResumen = {
  id: number;
  nombre: string;
  rol: string;
  activo: boolean;
};

export type PerfilHomologacionListItem = PerfilHomologacionReadModel & {
  mikrotikRouter: {
    id: number;
    nombre: string;
    host: string;
    sshPort: number;
    descripcion: string | null;
    activo: boolean;
  };
  servicioInternet: {
    id: number;
    nombre: string;
    velocidad: string | null;
    precio: number;
    estado: string;
  };
  creadoPor: PerfilHomologacionUsuarioResumen | null;
  actualizadoPor: PerfilHomologacionUsuarioResumen | null;
  conteos: {
    cuentas: number;
    auditorias: number;
  };
};

export type PerfilHomologacionFiltros = {
  search: string | null;
  activo: boolean | null;
  mikrotikRouterId: number | null;
  servicioInternetId: number | null;
};

/** Homologación activa, de router activo y servicio activo, para un combo. */
export type PerfilHomologacionSeleccionable = {
  id: number;
  codigoPerfil: string;
  mikrotikRouterId: number;
  servicioInternetId: number;
  mikrotikRouter: {
    id: number;
    nombre: string;
  };
  servicioInternet: {
    id: number;
    nombre: string;
    velocidad: string | null;
    precio: number;
  };
};
