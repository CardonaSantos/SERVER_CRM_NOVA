import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { TipoInstalacionCliente } from '../../domain/enums/tipo-instalacion-cliente.enum';
import { AsignarTecnicoInstalacionDto } from './asignar-tecnico-instalacion.dto';
import { Type } from 'class-transformer';

export class CrearClienteInstalacionDto {
  @IsInt()
  @Min(1)
  empresaId: number;

  @IsInt()
  @Min(1)
  clienteId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  servicioInternetId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  ticketId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  asesorId?: number;

  @IsOptional()
  @IsEnum(TipoInstalacionCliente)
  tipo?: TipoInstalacionCliente;

  @IsOptional()
  @IsDateString()
  fechaProgramada?: string;

  @IsOptional()
  @IsString()
  direccionInstalacion?: string;

  @IsOptional()
  @IsString()
  referenciaUbicacion?: string;

  @IsOptional()
  @IsNumber()
  latitud?: number;

  @IsOptional()
  @IsNumber()
  longitud?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique((tecnico: AsignarTecnicoInstalacionDto) => tecnico.tecnicoId)
  @ValidateNested({ each: true })
  @Type(() => AsignarTecnicoInstalacionDto)
  tecnicos?: AsignarTecnicoInstalacionDto[];
}
