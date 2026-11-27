import { IsEmail, IsOptional, MaxLength } from 'class-validator';
import { Recortar } from 'src/common/http/transformaciones-query';

export class RestaurarUsuarioDto {
  /** Solo si el correo que tenía ya lo usa otra cuenta */
  @IsOptional()
  @Recortar()
  @IsEmail()
  @MaxLength(190)
  correo?: string;
}
