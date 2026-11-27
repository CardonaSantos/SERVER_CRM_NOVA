import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  CategoriaPlantilla,
  EstadoPlantilla,
} from '../../domain/enums/plantilla.enum';

export class ListarPlantillasQueryDto {
  /** Parte del nombre */
  @IsOptional()
  @IsString()
  name?: string;

  /** Idioma */
  @IsOptional()
  @IsString()
  language?: string;

  /** Categoría */
  @IsOptional()
  @IsEnum(CategoriaPlantilla)
  category?: CategoriaPlantilla;

  /** Estado en WhatsApp */
  @IsOptional()
  @IsEnum(EstadoPlantilla)
  status?: EstadoPlantilla;

  /** Plantillas por página, máximo 100 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  /** Cursor `meta.siguiente` de la página anterior */
  @IsOptional()
  @IsString()
  after?: string;
}
