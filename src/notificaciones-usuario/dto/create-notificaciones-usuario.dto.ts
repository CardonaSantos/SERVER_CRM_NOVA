import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateNotificacionUsuarioDto {
  @IsInt()
  @IsNotEmpty()
  usuarioId: number;

  @IsInt()
  @IsNotEmpty()
  notificacionId: number;
}
