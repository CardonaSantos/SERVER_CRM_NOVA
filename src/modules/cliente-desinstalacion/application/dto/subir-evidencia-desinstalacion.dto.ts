import { Transform } from 'class-transformer';

import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TipoEvidenciaClienteOperacion } from 'src/modules/cliente-instalacion/domain/enums/tipo-evidencia-cliente-operacion.enum';

const toNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return Number(value);
};

export class SubirEvidenciaDesinstalacionDto {
  @IsEnum(TipoEvidenciaClienteOperacion)
  tipo: TipoEvidenciaClienteOperacion;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string | null;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(0)
  orden?: number;
}
