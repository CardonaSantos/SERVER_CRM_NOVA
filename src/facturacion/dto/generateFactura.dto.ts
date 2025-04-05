import { IsInt } from 'class-validator';

export class GenerateFactura {
  @IsInt()
  clienteId: number;
  @IsInt()
  mes: number;
  @IsInt()
  anio: number;
}
