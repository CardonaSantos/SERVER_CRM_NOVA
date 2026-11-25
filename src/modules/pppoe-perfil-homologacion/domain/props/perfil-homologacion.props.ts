export type PerfilHomologadoEntityProps = {
  id: number | null;

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

export type CrearPerfilHomologadoEntityProps = {
  empresaId: number;

  mikrotikRouterId: number;
  servicioInternetId: number;

  codigoPerfil: string;

  creadoPorId?: number | null;
};
