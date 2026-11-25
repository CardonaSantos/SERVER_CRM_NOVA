import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

import { ComoBooleano, Recortar } from 'src/common/http/transformaciones-query';

import { CategoriaMedia, TipoMedia } from '../../domain/enums/media.enum';

/**
 * Campos multipart de `POST /media/batch` (los archivos van en `files`).
 * Todo llega como texto; las conversiones son explícitas.
 */
export class SubirMediaLoteDto {
  /**
   * Obsoleto: se ignora. La empresa sale de la sesión.
   * Se acepta para no romper clientes que todavía lo envían.
   */
  @IsOptional()
  @IsString()
  empresaId?: string;

  /**
   * Obsoleto: se ignora. Quien sube es el usuario de la sesión.
   * Se acepta para no romper clientes que todavía lo envían.
   */
  @IsOptional()
  @IsString()
  subidoPorId?: string;

  /** Cliente al que pertenecen los archivos. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  clienteId?: number;

  /** Álbum al que pertenecen los archivos. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  albumId?: number;

  /** URL pública (true por defecto): 'true' / 'false' / '1' / '0'. */
  @IsOptional()
  @ComoBooleano()
  @IsBoolean()
  publico?: boolean;

  /** Categoría de negocio. Por defecto CLIENTE_GENERAL. */
  @IsOptional()
  @IsIn(Object.values(CategoriaMedia))
  categoria?: CategoriaMedia;

  /** Tipo declarado. Si se omite: VIDEO para video/*, si no IMAGEN. */
  @IsOptional()
  @IsIn(Object.values(TipoMedia))
  tipo?: TipoMedia;

  /** Prefijo raíz de la ruta en el almacenamiento. */
  @IsOptional()
  @Recortar()
  @IsString()
  @MaxLength(100)
  basePrefix?: string;

  /**
   * JSON con un objeto por archivo, en el mismo orden:
   * `[{ "titulo": "…", "descripcion": "…", "etiqueta": "…" }]`.
   */
  @IsOptional()
  @IsString()
  items?: string;
}
