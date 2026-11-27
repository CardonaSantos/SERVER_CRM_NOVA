import { EstadoServicio } from '../enums/estado-servicio.enum';

export type TipoServicioProps = {
  id: number | null;
  nombre: string;
  descripcion: string | null;
  estado: EstadoServicio;
  creadoEn: Date;
  actualizadoEn: Date;
};

export type CrearTipoServicioProps = {
  nombre: string;
  descripcion?: string | null;
};
