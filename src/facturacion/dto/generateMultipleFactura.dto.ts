import { IsInt } from 'class-validator';

export class GenerateFacturaMultipleDto {
  @IsInt()
  mesInicio: number;
  @IsInt()
  mesFin: number;
  @IsInt()
  anio: number;
  @IsInt()
  clienteId: number;
}
