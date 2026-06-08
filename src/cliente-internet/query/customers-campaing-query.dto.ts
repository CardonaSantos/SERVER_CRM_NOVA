import { EstadoCliente, EstadoCobranzaCliente } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CustomersCampaingQuery {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  zonaF?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  sector?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  municipio?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  departamento?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim())
  nombre?: string;

  // número de facturas pendientes
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  numeroFact?: number;

  @IsOptional()
  @IsEnum(EstadoCliente)
  estado?: EstadoCliente;

  @IsOptional()
  @IsEnum(EstadoCobranzaCliente)
  estadoCobranza?: EstadoCobranzaCliente;
}
