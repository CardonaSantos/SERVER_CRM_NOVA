/** Fecha de negocio de cada trabajo finalizado en el rango. */
export type TrabajosDeCampoFinalizados = {
  instalaciones: string[];
  desinstalaciones: string[];
};

export type ParInstalaciones = {
  instalaciones: number;
  desinstalaciones: number;
};

export type InstalacionesMesReadModel = {
  periodo: { desde: string; hasta: string };
  totales: ParInstalaciones & { balance: number };
  actividadDiaria: Array<ParInstalaciones & { fecha: string }>;
};

export type InstalacionesHistoricasReadModel = {
  periodo: { desde: string; hasta: string; meses: number };
  totales: ParInstalaciones & {
    balance: number;
    promedioInstalacionesMes: number;
    promedioDesinstalacionesMes: number;
  };
  actividadMensual: Array<ParInstalaciones & { mes: string; balance: number }>;
};
