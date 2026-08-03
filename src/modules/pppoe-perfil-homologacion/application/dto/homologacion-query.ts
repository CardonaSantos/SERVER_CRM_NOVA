import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class ListarPerfilesHomologacionSeleccionablesQuery {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
