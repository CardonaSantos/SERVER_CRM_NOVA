import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class PayMoraCuotaDto {
  @Type(() => Number)
  @IsInt()
  moraId: number;

  @Type(() => Number)
  @IsInt()
  userId: number;
}
