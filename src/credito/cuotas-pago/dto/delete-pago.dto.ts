import { Transform, Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class DeletePagoCuotaDto {
  @Type(() => Number)
  @IsInt()
  pagoCuotaId: number;

  @Type(() => Number)
  @IsInt()
  userId: number;
}
