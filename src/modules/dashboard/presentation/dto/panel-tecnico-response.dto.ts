import { PanelTecnicoReadModel } from '../../domain/read-models/panel-tecnico.read-model';

/** La app Android valida esta forma: no quitar ni renombrar campos. */
export class PanelTecnicoResponseDto {
  /** Quien tiene la sesión */
  tecnico: PanelTecnicoReadModel['tecnico'];
  /** Mes en curso */
  periodo: {
    inicioMes: string;
    finMes: string;
    diasTranscurridos: number;
    zonaHoraria: string;
  };
  /** Trabajo pendiente */
  cargaActual: PanelTecnicoReadModel['cargaActual'];
  /** Trabajo terminado en el mes */
  productividadMes: PanelTecnicoReadModel['productividadMes'];
  /** Promedios en minutos; `null` sin datos */
  tiempos: PanelTecnicoReadModel['tiempos'];
  /** Días de mayor y menor actividad */
  resumenActividad: PanelTecnicoReadModel['resumenActividad'];
  /** Un punto por día del mes */
  actividadDiaria: PanelTecnicoReadModel['actividadDiaria'];
}
