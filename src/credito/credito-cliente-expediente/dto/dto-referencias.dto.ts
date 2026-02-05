import { IsString, IsNotEmpty } from 'class-validator';

export class ClienteReferenciaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsString()
  @IsNotEmpty()
  relacion: string;
}
