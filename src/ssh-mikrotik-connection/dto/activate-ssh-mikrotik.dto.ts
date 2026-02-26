import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class ActivateCustomerDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  clienteId: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  userId: number;

  @IsOptional()
  @IsString()
  @Length(3, 100)
  password: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPasswordRequired: boolean = true;
}
