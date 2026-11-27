export type TecnicoDelPanel = {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
};

export type CargaTecnico = {
  ticketsPendientes: number;
  ticketsListosParaTrabajar: number;
  ticketsUrgentes: number;
  ticketsConMas48Horas: number;
  instalacionesPendientes: number;
  instalacionesProgramadasHoy: number;
  instalacionesAtrasadas: number;
};

export type TicketResueltoTecnico = {
  /** Fecha de negocio del cierre. */
  fecha: string;
  inicio: Date;
  fin: Date | null;
};

export type InstalacionCompletadaTecnico = {
  /** Fecha de negocio de finalización. */
  fecha: string;
  minutosRegistrados: number | null;
  inicio: Date | null;
  fin: Date;
};

export type ActividadDiaTecnico = {
  fecha: string;
  etiqueta: string;
  tickets: number;
  instalaciones: number;
  total: number;
};

export type PanelTecnicoReadModel = {
  tecnico: TecnicoDelPanel;
  periodo: { inicioMes: Date; finMes: Date; diasTranscurridos: number };
  cargaActual: CargaTecnico;
  productividadMes: {
    ticketsResueltos: number;
    instalacionesCompletadas: number;
    trabajosCompletados: number;
    diasConActividad: number;
    promedioTicketsPorDia: number;
    ritmoSemanalTickets: number;
    promedioTrabajosPorDiaActivo: number;
  };
  tiempos: {
    promedioResolucionTicketMinutos: number | null;
    promedioInstalacionMinutos: number | null;
  };
  resumenActividad: {
    diaMasProductivo: ActividadDiaTecnico | null;
    diaMenosProductivoConActividad: ActividadDiaTecnico | null;
  };
  actividadDiaria: ActividadDiaTecnico[];
};
