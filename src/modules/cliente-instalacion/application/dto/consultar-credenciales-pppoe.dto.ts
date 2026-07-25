import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ConsultarCredencialesPppoeDto {
  /**
   * Temporalmente se recibe en el body.
   * Después se obtendrá del usuario autenticado.
   */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  operadorId: number;
}
