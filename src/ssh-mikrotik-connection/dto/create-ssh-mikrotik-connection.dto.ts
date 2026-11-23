import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * POST /ssh-mikrotik-connection/suspend-customer (validadores: etapa 8,
 * con el mismo criterio que ActivateCustomerDto).
 */
export class SuspendCustomerDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  clienteId: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  userId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  password: string;
}
