// update-sector.dto.ts
import { IsString, IsOptional, IsInt } from 'class-validator';

export class UpdateSectorDto {
  @IsOptional()
  @IsString()
  nombre?: string; // Nombre del sector

  @IsOptional()
  @IsString()
  descripcion?: string; // Descripción opcional

  @IsOptional()
  @IsInt()
  municipioId?: number; // ID del municipio asociado (opcional en la actualización)
}
