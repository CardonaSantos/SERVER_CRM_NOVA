import { IsInt, IsString } from 'class-validator';

export class CreateIdContratoDto {
  @IsInt()
  clienteId: number;
  @IsString()
  idContrato: string;
  @IsString()
  fechaFirma: string;
  @IsString()
  archivoContrato: string;
  @IsString()
  observaciones: string;
}
