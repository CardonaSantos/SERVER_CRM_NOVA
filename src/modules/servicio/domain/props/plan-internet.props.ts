import { EstadoServicio } from '../enums/estado-servicio.enum';

export type PlanInternetProps = {
  id: number | null;
  empresaId: number;
  nombre: string;
  velocidad: string | null;
  precio: number;
  estado: EstadoServicio;
  creadoEn: Date;
  actualizadoEn: Date;
  eliminadoEn: Date | null;
  eliminadoPorId: number | null;
};

export type CrearPlanInternetProps = {
  empresaId: number;
  nombre: string;
  velocidad?: string | null;
  precio: number;
};

/** Lo que no llega no cambia. El precio tiene su propia operación. */
export type ActualizarPlanInternetProps = {
  nombre?: string;
  velocidad?: string | null;
  estado?: EstadoServicio;
};
