import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

const toNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  return Number(value);
};

export class ActualizarClienteInstalacionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(toNumber)
  asesorId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(toNumber)
  servicioInternetId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(toNumber)
  ticketId?: number | null;

  @IsOptional()
  @IsDateString()
  fechaProgramada?: string | null;

  @IsOptional()
  @IsString()
  direccionInstalacion?: string | null;

  @IsOptional()
  @IsString()
  referenciaUbicacion?: string | null;

  @IsOptional()
  @IsNumber()
  @Transform(toNumber)
  latitud?: number | null;

  @IsOptional()
  @IsNumber()
  @Transform(toNumber)
  longitud?: number | null;

  @IsOptional()
  @IsString()
  observaciones?: string | null;
}
