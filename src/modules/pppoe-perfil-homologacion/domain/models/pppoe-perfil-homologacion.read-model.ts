export type PerfilHomologacionUsuarioResumen = {
  id: number;

  nombre: string;
  correo: string;

  rol: string;

  activo: boolean;
};

export type PerfilHomologacionMikrotikResumen = {
  id: number;

  nombre: string;
  host: string;
  sshPort: number;

  descripcion: string | null;

  activo: boolean;
};

export type PerfilHomologacionServicioResumen = {
  id: number;

  nombre: string;
  velocidad: string | null;

  precio: number;

  estado: string;
};

export type PerfilHomologacionListItem = {
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

  mikrotikRouter: PerfilHomologacionMikrotikResumen;

  servicioInternet: PerfilHomologacionServicioResumen;

  creadoPor: PerfilHomologacionUsuarioResumen | null;

  actualizadoPor: PerfilHomologacionUsuarioResumen | null;

  conteos: {
    cuentas: number;
    auditorias: number;
  };
};

/**
 * Inicialmente el detalle contiene la misma información
 * enriquecida que el item del listado.
 *
 * Puede ampliarse después sin alterar el listado.
 */
export type PerfilHomologacionDetalle = PerfilHomologacionListItem;

export type PerfilHomologacionFindManyFilters = {
  page: number;
  limit: number;

  search?: string | null;

  activo?: boolean | null;

  mikrotikRouterId?: number | null;

  servicioInternetId?: number | null;
};

export type PerfilHomologacionPaginatedResult = {
  items: PerfilHomologacionListItem[];

  total: number;

  page: number;
  limit: number;

  totalPages: number;
};
