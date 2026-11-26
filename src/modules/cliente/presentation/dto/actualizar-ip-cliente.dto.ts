import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class ActualizarIpClienteDto {
  /** Cliente al que pertenece la IP */
  @IsInt()
  @IsPositive()
  clienteId: number;

  /** Dirección IP */
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  direccionIp: string;

  /** Puerta de enlace */
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  gateway: string;

  /** Máscara de red */
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  mascara: string;
}
