import { IsInt, IsOptional } from 'class-validator';

export class GenerateFactura {
  @IsInt()
  @IsOptional()
  creadorId: number;
  @IsInt()
  clienteId: number;
  @IsInt()
  mes: number;
  @IsInt()
  anio: number;
}
