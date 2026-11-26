import { IsNumber, IsOptional, Min } from 'class-validator';

export class ActualizarCostosDesinstalacionDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  saldoClienteAlMomento?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costoDesinstalacion?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costoTransporte?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costoManoObra?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costoOtros?: number;
}
