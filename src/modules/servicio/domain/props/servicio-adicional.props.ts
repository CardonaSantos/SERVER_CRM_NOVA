import { EstadoServicio } from '../enums/estado-servicio.enum';

export type ServicioAdicionalProps = {
  id: number | null;
  empresaId: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  estado: EstadoServicio;
  tipoServicioId: number | null;
  creadoEn: Date;
  actualizadoEn: Date;
  eliminadoEn: Date | null;
  eliminadoPorId: number | null;
};

export type CrearServicioAdicionalProps = {
  empresaId: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  tipoServicioId?: number | null;
};

/** Lo que no llega no cambia; `null` quita la descripción o el tipo. */
export type ActualizarServicioAdicionalProps = {
  nombre?: string;
  descripcion?: string | null;
  precio?: number;
  estado?: EstadoServicio;
  tipoServicioId?: number | null;
};
