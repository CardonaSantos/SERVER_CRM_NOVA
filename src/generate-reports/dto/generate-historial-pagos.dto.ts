import { IsArray, IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateHistorialPagosDto {
  @IsArray()
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  ids: number[];
}

export class ExportInfoDto {
  @IsArray()
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  ids: number[];
}
