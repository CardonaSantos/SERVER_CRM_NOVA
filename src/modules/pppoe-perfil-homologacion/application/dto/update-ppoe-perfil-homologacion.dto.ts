import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class UpdatePpoePerfilHomologacionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  codigoPerfil: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  actualizadoPorId: number;
}
