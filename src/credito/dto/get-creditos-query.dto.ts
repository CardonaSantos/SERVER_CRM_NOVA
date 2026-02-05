import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoCredito } from '@prisma/client';

export class GetCreditosQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string; // Buscará por ID de crédito o Nombre de cliente

  @IsOptional()
  @IsEnum(EstadoCredito)
  estado?: EstadoCredito;
}
