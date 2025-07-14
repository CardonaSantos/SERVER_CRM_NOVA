import { IsInt, IsOptional, IsString } from 'class-validator';

export class RegistrarPagoFromBanruralDto {
  @IsInt()
  clienteId: number;
  @IsInt()
  facturaId: number;
  @IsInt()
  monto: number;
  @IsString()
  moneda: string;
  @IsString()
  @IsOptional()
  descripcion: string;
}
