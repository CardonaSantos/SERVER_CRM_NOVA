import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegistrarFirmaClienteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombreFirmante: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  telefonoFirmante: string;
}
