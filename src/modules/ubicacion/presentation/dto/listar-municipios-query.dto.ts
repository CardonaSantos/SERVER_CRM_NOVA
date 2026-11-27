import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ListarMunicipiosQueryDto {
  /** Solo los de este departamento */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departamentoId?: number;
}
