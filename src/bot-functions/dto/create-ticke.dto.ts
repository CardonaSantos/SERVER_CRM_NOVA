import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateTicketDtoFromBot {
  @IsOptional()
  @IsInt()
  dpi: number;

  @IsString()
  @IsOptional()
  nombreCliente: string;

  @IsString()
  @IsOptional()
  telefono: string;

  @IsString()
  @IsOptional()
  telefonoRef: string;
}
