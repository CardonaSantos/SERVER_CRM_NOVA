import { PartialType } from '@nestjs/mapped-types';
import { ClienteInternet, Empresa, EstadoRuta, Usuario } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateRutaDto {
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

  @IsOptional()
  @IsEnum(EstadoRuta)
  estadoRuta?: EstadoRuta;

  @IsOptional()
  @IsInt()
  EmpresaId?: number;

  @IsOptional()
  Empresa?: Empresa;
}
