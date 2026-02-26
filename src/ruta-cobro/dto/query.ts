import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { EstadoRuta } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';
export class BasePaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

export class queryRutasDto extends BasePaginationDto {
  @IsOptional()
  @IsEnum(EstadoRuta)
  estado?: EstadoRuta;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cobrador?: number;

  @IsOptional()
  @IsString()
  nombreRuta?: string;
}
