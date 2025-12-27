import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateTicketSolucioneDto {
  @IsString()
  solucion: string;

  @IsString()
  descripcion: string;

  @IsOptional()
  @IsBoolean()
  isEliminado?: boolean;

  @IsOptional()
  @IsInt()
  id?: number;
}
