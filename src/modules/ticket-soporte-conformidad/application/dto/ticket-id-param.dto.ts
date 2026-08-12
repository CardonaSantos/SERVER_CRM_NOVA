import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class TicketIdParamDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  ticketId: number;
}
