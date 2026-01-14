import { IsInt, IsPositive } from 'class-validator';

export class GetCreditosQueryDto {
  @IsInt()
  @IsPositive()
  id: number;
}
