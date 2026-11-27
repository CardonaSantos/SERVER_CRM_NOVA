import { PeriodoResponseDto } from './resumen-response.dto';

export class InstalacionesMesResponseDto {
  /** Mes en curso hasta hoy */
  periodo: PeriodoResponseDto;
  /** Totales del período */
  totales: {
    instalaciones: number;
    desinstalaciones: number;
    balance: number;
  };
  /** Un punto por día */
  actividadDiaria: Array<{
    fecha: string;
    instalaciones: number;
    desinstalaciones: number;
  }>;
}

export class InstalacionesHistoricasResponseDto {
  /** Últimos doce meses */
  periodo: PeriodoResponseDto & { meses: number };
  /** Totales y promedios del período */
  totales: {
    instalaciones: number;
    desinstalaciones: number;
    balance: number;
    promedioInstalacionesMes: number;
    promedioDesinstalacionesMes: number;
  };
  /** Un punto por mes */
  actividadMensual: Array<{
    mes: string;
    instalaciones: number;
    desinstalaciones: number;
    balance: number;
  }>;
}
