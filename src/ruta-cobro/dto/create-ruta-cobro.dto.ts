import { ClienteInternet, Empresa, EstadoRuta, Usuario } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateRutaDto {
  @IsInt()
  id: number;

  @IsString()
  nombreRuta: string;

  @IsInt()
  cobradorId: number;

  @IsOptional()
  cobrador?: Usuario;

  @IsInt()
  cobrados: number;

  @IsInt()
  montoCobrado: number;

  @IsOptional()
  Clientes?: ClienteInternet[];

  @IsOptional()
  clientesIds?: number[];

  @IsEnum(EstadoRuta)
  estadoRuta: EstadoRuta;

  @IsInt()
  EmpresaId: number;

  @IsOptional()
  Empresa?: Empresa;
}
