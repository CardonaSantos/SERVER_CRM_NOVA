import { IsBoolean, IsInt, IsString } from 'class-validator';

export class UserTokenAuth {
  @IsString()
  nombre: string;
  @IsString()
  correo: string;
  @IsString()
  rol: string;
  @IsBoolean()
  activo: boolean;
  @IsInt()
  empresaId: number;
}
