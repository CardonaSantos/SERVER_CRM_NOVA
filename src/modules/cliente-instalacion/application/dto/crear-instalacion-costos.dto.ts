import { Transform } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const toOptionalNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return Number(value);
};

const toOptionalTrimmedString = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = String(value).trim();

  return normalized === '' ? undefined : normalized;
};

export class CrearClienteInstalacionCostosDto {
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber()
  @Min(0)
  costoInstalacion?: number;

  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber()
  @Min(0)
  costoMateriales?: number;

  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber()
  @Min(0)
  costoManoObra?: number;

  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber()
  @Min(0)
  costoOtros?: number;

  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber()
  @Min(0)
  montoCobradoCliente?: number;

  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber()
  @Min(0)
  saldoPendiente?: number;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsString()
  @MaxLength(1000)
  notas?: string;
}
