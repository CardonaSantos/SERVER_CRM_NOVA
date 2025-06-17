import { IsInt, IsOptional } from 'class-validator';

export class GenerateFacturaMultipleDto {
  @IsInt()
  @IsOptional()
  creadorId: number;
  @IsInt()
  mesInicio: number;
  @IsInt()
  mesFin: number;
  @IsInt()
  anio: number;
  @IsInt()
  clienteId: number;
}
