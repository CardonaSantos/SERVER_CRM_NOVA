import { PartialType } from '@nestjs/swagger';
import { ClienteInternet, Empresa, EstadoRuta, Usuario } from '@prisma/client';
import { IsArray, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateRutaDto {
  /** El id viaja en la URL (/update-one-ruta/:id); en el body es opcional. */
  @IsOptional()
  @IsInt()
  id?: number;

  @IsOptional()
  @IsString()
  nombreRuta?: string;

  @IsOptional()
  @IsInt()
  cobradorId?: number;

  @IsOptional()
  cobrador?: Usuario;

  @IsOptional()
  @IsInt()
  cobrados?: number;

  @IsOptional()
  @IsInt()
  montoCobrado?: number;

  @IsOptional()
  Clientes?: ClienteInternet[];

  @IsArray()
  clientes: number[];

  @IsOptional()
  @IsEnum(EstadoRuta)
  estadoRuta?: EstadoRuta;

  @IsOptional()
  @IsInt()
  empresaId?: number;

  @IsOptional()
  Empresa?: Empresa;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
