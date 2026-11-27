import { IsOptional, Matches } from 'class-validator';

export class MetricaMesQueryDto {
  /** Mes a consultar (YYYY-MM). Sin él, el actual en Guatemala. */
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'mes debe tener el formato YYYY-MM',
  })
  mes?: string;
}
