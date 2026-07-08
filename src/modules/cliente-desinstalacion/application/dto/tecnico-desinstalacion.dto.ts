import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { RolTecnicoOperacionCliente } from 'src/modules/cliente-instalacion/domain/enums/rol-tecnico-operacion-cliente.enum';
export class AsignarTecnicoDesinstalacionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  tecnicoId?: number | null;

  @IsOptional()
  @IsEnum(RolTecnicoOperacionCliente)
  rol?: RolTecnicoOperacionCliente;

  @IsOptional()
  @IsBoolean()
  esResponsable?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  tiempoMinutos?: number | null;

  @IsOptional()
  @IsString()
  observaciones?: string | null;

  @IsOptional()
  @IsString()
  tecnicoNombreSnapshot?: string | null;
}
