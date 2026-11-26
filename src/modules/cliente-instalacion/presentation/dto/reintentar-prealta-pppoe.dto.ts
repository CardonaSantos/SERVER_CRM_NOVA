import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ReintentarPrealtaPppoeDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  mikrotikRouterId: number;
}
