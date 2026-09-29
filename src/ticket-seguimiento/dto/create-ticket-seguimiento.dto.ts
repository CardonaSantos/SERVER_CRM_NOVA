import { Transform } from 'class-transformer';
import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateTicketSeguimientoDto {
  @IsInt()
  @Min(1)
  ticketId: number;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  descripcion: string;
}
