import { CreateFacturacionZonaDto } from './create-facturacion-zona.dto';
import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class UpdateFacturacionZonaDto extends CreateFacturacionZonaDto {
  @IsInt()
  id: number; // ID de la zona a actualizar
}
