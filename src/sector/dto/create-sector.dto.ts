// create-sector.dto.ts
import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateSectorDto {
  @IsString()
  nombre: string; // Nombre del sector (ej. "Zona Norte", "Sector 1", etc.)

  @IsOptional()
  @IsString()
  descripcion?: string; // Descripción opcional del sector

  @IsInt()
  municipioId: number; // ID del municipio asociado al sector
}
