import { EstadoCampania, EstadoEnvio } from '../enums/campania.enum';

export type TotalesCampania = {
  total: number;
  pendientes: number;
  enviados: number;
  fallidos: number;
  omitidos: number;
  sinConfirmar: number;
};

export type CampaniaReadModel = {
  id: number;
  plantilla: string;
  idioma: string;
  imagenUrl: string | null;
  estado: EstadoCampania;
  creadoEn: Date;
  actividadEn: Date;
  finalizadaEn: Date | null;
  creadoPor: { id: number; nombre: string } | null;
  totales: TotalesCampania;
};

export type EnvioListItem = {
  id: number;
  clienteId: number;
  cliente: string;
  telefono: string | null;
  estado: EstadoEnvio;
  motivo: string | null;
  detalle: string | null;
  intentadoEn: Date | null;
};

export type EnvioFiltros = { estado?: EstadoEnvio };
