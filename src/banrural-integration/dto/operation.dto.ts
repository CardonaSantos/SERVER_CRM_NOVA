import { IsInt, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class IniciarPagoDto {
  @IsInt()
  clienteId: number;

  @IsInt()
  facturaId: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto: number;

  @IsString()
  moneda: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
