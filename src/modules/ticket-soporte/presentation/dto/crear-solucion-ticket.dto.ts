import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearSolucionTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string | null;
}
