import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateTicketSolucioneDto {
  @IsString()
  solucion: string;

  @IsString()
  descripcion: string;

  @IsOptional()
  @IsBoolean()
  isEliminado?: boolean;
}
