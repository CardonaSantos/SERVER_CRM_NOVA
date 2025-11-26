// create-mikrotik.dto.ts
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateMikroTikDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  passwordEnc: string;

  @IsString()
  @IsNotEmpty()
  host: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional() // si no lo envían, tú puedes poner 22 en el service
  sshPort?: number;

  @IsString()
  @IsNotEmpty()
  usuario: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean; // default true en service / DB

  @IsOptional()
  @IsInt()
  oltId?: number;

  @IsOptional()
  @IsInt()
  empresaId?: number;

  @IsOptional()
  @IsInt()
  id: number;
}
