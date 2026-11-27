import { ActividadTicketsReadModel } from '../../domain/read-models/actividad-tickets.read-model';
import { PeriodoResponseDto } from './resumen-response.dto';

export class ActividadTicketsResponseDto {
  /** Rango resuelto */
  periodo: PeriodoResponseDto & {
    preset: string;
    granularidad: string;
    puntos: number;
  };
  /** Totales del período y pendientes de hoy */
  resumen: ActividadTicketsReadModel['resumen'];
  /** Promedios en minutos; `null` sin datos */
  tiempos: ActividadTicketsReadModel['tiempos'];
  /** Conteo por prioridad */
  prioridades: ActividadTicketsReadModel['prioridades'];
  /** Contra el período anterior; `null` en el histórico */
  comparativa: ActividadTicketsReadModel['comparativa'];
  /** Un punto por día, mes, trimestre o año */
  actividad: ActividadTicketsReadModel['actividad'];
}
