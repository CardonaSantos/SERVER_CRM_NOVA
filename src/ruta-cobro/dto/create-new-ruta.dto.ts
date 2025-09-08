import { IsArray, IsInt, IsString } from 'class-validator';

export class CreateNewRutaDto {
  @IsString()
  nombreRuta: string;
  @IsInt()
  cobradorId: number;
  @IsInt()
  empresaId: number;
  @IsArray()
  clientes?: number[];
  @IsString()
  observaciones: string;

  @IsArray()
  facturas?: [];

  @IsInt()
  asignadoPor: number;
}
