export type PerfilHomologacionProps = {
  id: number | null;
  empresaId: number;
  mikrotikRouterId: number;
  servicioInternetId: number;
  /** Nombre exacto del profile en MikroTik. */
  codigoPerfil: string;
  activo: boolean;
  creadoPorId: number | null;
  actualizadoPorId: number | null;
  creadoEn: Date;
  actualizadoEn: Date;
};

export type CrearPerfilHomologacionProps = {
  empresaId: number;
  mikrotikRouterId: number;
  servicioInternetId: number;
  codigoPerfil: string;
  creadoPorId?: number | null;
};
