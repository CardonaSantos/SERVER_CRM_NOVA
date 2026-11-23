import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

/** PATCH /customer-network-config/update-ip-mk (validadores: etapa 8). */
export class UpdateCustomerIpAndNetworkDto {
  @IsInt()
  @IsPositive()
  clienteId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  direccionIp: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  gateway: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  mascara: string;

  // seguridad / auditoría
  @IsInt()
  @IsPositive()
  userId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  password: string;
}
