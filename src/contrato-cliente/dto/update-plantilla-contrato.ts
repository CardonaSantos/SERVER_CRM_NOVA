import { IsInt } from 'class-validator';
import { CreatePlantillaContratoDto } from './create-plantilla-contrato';

export class UpdatePlantillaContratoDto extends CreatePlantillaContratoDto {
  @IsInt()
  id: number;
}
