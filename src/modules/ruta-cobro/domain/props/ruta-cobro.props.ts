import { EstadoRutaCobro } from '../enums/estado-ruta-cobro.enum';

export type RutaCobroProps = {
  id: number | null;
  empresaId: number;
  nombre: string;
  cobradorId: number | null;
  estado: EstadoRutaCobro;
  observaciones: string | null;
  clienteIds: number[];
  creadoEn: Date;
  actualizadoEn: Date;
  eliminadoEn: Date | null;
  eliminadoPorId: number | null;
};

export type CrearRutaCobroProps = {
  empresaId: number;
  nombre: string;
  cobradorId?: number | null;
  observaciones?: string | null;
  clienteIds: number[];
};

/** Lo que no llega no cambia; `null` quita el cobrador o las observaciones. */
export type EditarRutaCobroProps = {
  nombre?: string;
  cobradorId?: number | null;
  observaciones?: string | null;
  estado?: EstadoRutaCobro;
  clienteIds?: number[];
};
