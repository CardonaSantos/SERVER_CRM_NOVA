import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { MotivoDesinstalacionCliente } from '../../domain/enums/motivo-desinstalacion-cliente.enum';
import { TipoDesinstalacionCliente } from '../../domain/enums/tipo-desinstalacion-cliente.enum';

import { AsignarTecnicoDesinstalacionDto } from './tecnico-desinstalacion.dto';

export class CrearClienteDesinstalacionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clienteId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  accesoInternetId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ticketId?: number | null;

  @IsEnum(TipoDesinstalacionCliente)
  tipo: TipoDesinstalacionCliente;

  @IsEnum(MotivoDesinstalacionCliente)
  motivo: MotivoDesinstalacionCliente;

  @IsDateString()
  fechaProgramada: string;

  @IsOptional()
  @IsBoolean()
  requiereRetiroEquipo?: boolean;

  @IsOptional()
  @IsString()
  observaciones?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AsignarTecnicoDesinstalacionDto)
  tecnicos?: AsignarTecnicoDesinstalacionDto[];
}
