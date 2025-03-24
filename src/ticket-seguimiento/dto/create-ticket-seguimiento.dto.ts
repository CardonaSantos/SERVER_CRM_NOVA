import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTicketSeguimientoDto {
  @IsNumber()
  @IsNotEmpty()
  ticketId: number;
  @IsNumber()
  @IsNotEmpty()
  usuarioId: number;
  @IsString()
  @IsOptional()
  descripcion: string;
}
