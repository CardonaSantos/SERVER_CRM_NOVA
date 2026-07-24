import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ReintentarPrealtaPppoeDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  mikrotikRouterId: number;

  /**
   * Temporalmente se recibe por el body.
   * Posteriormente se obtendrá del usuario autenticado.
   */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  operadorId: number;
}
