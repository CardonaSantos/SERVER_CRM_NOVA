import { IsInt, Max, Min } from 'class-validator';

class PeriodoClienteDto {
  /** Cliente a facturar */
  @IsInt()
  @Min(1)
  clienteId: number;

  /** Año */
  @IsInt()
  @Min(2000)
  @Max(2100)
  anio: number;
}

export class GenerarFacturaDto extends PeriodoClienteDto {
  /** Mes (1 a 12) */
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;
}

export class GenerarFacturasDto extends PeriodoClienteDto {
  /** Primer mes (1 a 12) */
  @IsInt()
  @Min(1)
  @Max(12)
  mesInicio: number;

  /** Último mes (1 a 12), del mismo año */
  @IsInt()
  @Min(1)
  @Max(12)
  mesFin: number;
}
