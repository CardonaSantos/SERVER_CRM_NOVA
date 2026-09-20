import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum DashboardTicketsPreset {
  ULTIMOS_7_DIAS = '7D',
  ULTIMOS_30_DIAS = '30D',
  ULTIMOS_12_MESES = '12M',
  HISTORICO = 'HISTORICO',
  PERSONALIZADO = 'CUSTOM',
}

export class DashboardTicketsActividadQueryDto {
  @IsOptional()
  @IsEnum(DashboardTicketsPreset)
  preset: DashboardTicketsPreset = DashboardTicketsPreset.ULTIMOS_7_DIAS;

  /**
   * Se utilizan únicamente con preset=CUSTOM.
   *
   * Formato:
   * YYYY-MM-DD
   */
  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;
}
