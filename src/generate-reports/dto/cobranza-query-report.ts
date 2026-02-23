import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional } from 'class-validator';

export class QueryCobranzaReport {
  @IsOptional()
  @IsDate()
  startDate: Date;
  @IsOptional()
  @IsDate()
  endDate: Date;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId: number;
}
