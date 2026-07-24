import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreatePpoePerfilHomologacionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  empresaId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  mikrotikRouterId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  servicioInternetId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  codigoPerfil: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  creadoPorId: number;
}
