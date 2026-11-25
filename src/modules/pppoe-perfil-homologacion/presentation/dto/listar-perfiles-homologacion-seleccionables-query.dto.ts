import { IsOptional, IsString, MaxLength } from 'class-validator';

import { Recortar } from 'src/common/http/transformaciones-query';

export class ListarPerfilesHomologacionSeleccionablesQueryDto {
  /** Busca en código, nombre del router y nombre del servicio. */
  @IsOptional()
  @Recortar()
  @IsString()
  @MaxLength(100)
  search?: string;
}
