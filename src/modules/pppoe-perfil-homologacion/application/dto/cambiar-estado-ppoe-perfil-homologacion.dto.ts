import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CambiarEstadoPpoePerfilHomologacionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  actualizadoPorId: number;
}
