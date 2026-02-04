import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

//   @Transform(({ value }) => value === Number || value === 'true')

export class CreateContratoDto {
  @IsOptional()
  @Type((V) => Number)
  creditoId?: number;

  @IsString()
  contenido: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsOptional()
  firmadoEn?: string;
}
