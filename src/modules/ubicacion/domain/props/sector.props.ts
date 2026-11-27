export type SectorProps = {
  id: number | null;
  nombre: string;
  descripcion: string | null;
  municipioId: number;
  creadoEn: Date;
  actualizadoEn: Date;
  eliminadoEn: Date | null;
  eliminadoPorId: number | null;
};

export type CrearSectorProps = {
  nombre: string;
  descripcion?: string | null;
  municipioId: number;
};

/** Lo que no llega no cambia; `null` quita la descripción. */
export type ActualizarSectorProps = {
  nombre?: string;
  descripcion?: string | null;
  municipioId?: number;
};
