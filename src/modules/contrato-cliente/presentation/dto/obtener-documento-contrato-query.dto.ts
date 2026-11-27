import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ObtenerDocumentoContratoQueryDto {
  /** Instalación del documento */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  instalacionId: number;

  /** Plantilla con la que se arma */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  plantillaId: number;
}
