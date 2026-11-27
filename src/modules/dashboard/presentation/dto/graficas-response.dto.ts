import {
  ClientesPorPlanReadModel,
  ClientesPorUbicacionReadModel,
} from '../../domain/read-models/cartera.read-model';
import {
  CobradoPorMetodoReadModel,
  DeudaAntiguedadReadModel,
  FacturacionMensualReadModel,
} from '../../domain/read-models/finanzas.read-model';
import { PeriodoResponseDto } from './resumen-response.dto';

export class FacturacionMensualResponseDto {
  /** Meses incluidos */
  periodo: PeriodoResponseDto;
  /** Una fila por mes (dataset) */
  meses: FacturacionMensualReadModel['meses'];
  /** Suma de las filas */
  totales: FacturacionMensualReadModel['totales'];
}

export class CobradoPorMetodoResponseDto {
  /** Meses incluidos */
  periodo: PeriodoResponseDto;
  /** Total por método (dataset para pastel) */
  metodos: CobradoPorMetodoReadModel['metodos'];
  /** Una fila por mes con una columna por método (dataset para barras) */
  meses: CobradoPorMetodoReadModel['meses'];
  /** Suma del período */
  totales: CobradoPorMetodoReadModel['totales'];
}

export class DeudaAntiguedadResponseDto {
  /** Día al que se calcula (`YYYY-MM-DD`) */
  corte: string;
  /** Una fila por tramo (dataset) */
  tramos: DeudaAntiguedadReadModel['tramos'];
  /** Suma de los tramos y lo ya vencido */
  totales: DeudaAntiguedadReadModel['totales'];
  /** Deuda de desinstalados, fuera de los tramos */
  desinstalados: DeudaAntiguedadReadModel['desinstalados'];
}

export class ClientesPorPlanResponseDto {
  /** Una fila por plan (dataset) */
  planes: ClientesPorPlanReadModel['planes'];
  /** Activos a los que no se les genera factura */
  activosSinFacturar: ClientesPorPlanReadModel['activosSinFacturar'];
  /** Suma de los planes */
  totales: ClientesPorPlanReadModel['totales'];
}

export class ClientesPorUbicacionResponseDto {
  /** Agrupación usada */
  agrupar: string;
  /** Día al que se calcula (`YYYY-MM-DD`) */
  corte: string;
  /** Una fila por zona, sector o municipio (dataset) */
  grupos: ClientesPorUbicacionReadModel['grupos'];
  /** Suma de las filas */
  totales: ClientesPorUbicacionReadModel['totales'];
}
