import { IsInt, IsString } from 'class-validator';

export class CreatePlantillaContratoDto {
  @IsString()
  nombre: string;

  @IsString()
  body: string;

  @IsInt()
  empresaId: number;
}
