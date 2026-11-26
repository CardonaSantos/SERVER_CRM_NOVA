import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TipoEvidenciaClienteOperacion } from '../../domain/enums/tipo-evidencia-cliente-operacion.enum';

const toNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  return Number(value);
};

export class SubirEvidenciaInstalacionDto {
  @IsEnum(TipoEvidenciaClienteOperacion)
  tipo: TipoEvidenciaClienteOperacion;

  @IsOptional()
  @IsString()
  descripcion?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(toNumber)
  orden?: number;
}
