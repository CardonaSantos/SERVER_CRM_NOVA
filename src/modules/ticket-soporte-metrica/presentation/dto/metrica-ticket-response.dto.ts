import { TecnicoMetricaResponseDto } from './meta-ticket-response.dto';

export class SituacionTicketsResponseDto {
  /** Abiertos, en proceso y en revisión */
  activos: number;
  /** En proceso */
  enProceso: number;
  /** Resueltos hoy */
  resueltosHoy: number;
  /** Abiertos hoy que ya tienen técnico */
  asignadosHoy: number;
}

export class RendimientoTecnicoResponseDto {
  /** Técnico */
  tecnico: TecnicoMetricaResponseDto;
  /** Tickets abiertos o resueltos en el mes */
  totalTickets: number;
  /** Resueltos dentro del mes */
  resueltos: number;
  /** Del total, los no resueltos dentro del mes */
  pendientes: number;
  /** Porcentaje con un decimal */
  tasaResolucion: number;
  /** De la apertura al cierre; `null` si no resolvió nada */
  horasPromedio: number | null;
  /** Resueltos por día transcurrido */
  resueltosPorDia: number;
  /** Resueltos al cerrar el mes a este ritmo */
  proyeccion: number;
}

export class ResumenMetricasResponseDto {
  /** YYYY-MM */
  mes: string;
  /** Primer día del mes */
  desde: string;
  /** Último día del mes */
  hasta: string;
  /** Días del mes */
  diasTotales: number;
  /** Días transcurridos del mes */
  diasTranscurridos: number;
  /** Tickets distintos resueltos en el mes */
  resueltosDelMes: number;
  /** Situación de hoy, sin importar el mes pedido */
  ahora: SituacionTicketsResponseDto;
  /** De quien más resolvió a quien menos */
  tecnicos: RendimientoTecnicoResponseDto[];
}

export class ResueltosTecnicoDiaResponseDto {
  /** Id del usuario */
  tecnicoId: number;
  /** Tickets resueltos ese día */
  resueltos: number;
}

export class ResueltosDiaResponseDto {
  /** YYYY-MM-DD */
  fecha: string;
  /** Tickets distintos resueltos ese día */
  total: number;
  /** Solo quienes resolvieron algo */
  porTecnico: ResueltosTecnicoDiaResponseDto[];
}

export class ResueltosPorDiaResponseDto {
  /** YYYY-MM */
  mes: string;
  /** Quienes resolvieron algo en el mes */
  tecnicos: TecnicoMetricaResponseDto[];
  /** Un elemento por día del mes */
  dias: ResueltosDiaResponseDto[];
}
