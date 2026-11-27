import { PartialType } from '@nestjs/swagger';
import { CrearPlantillaContratoDto } from './crear-plantilla-contrato.dto';

/** Solo cambia lo que llega. */
export class EditarPlantillaContratoDto extends PartialType(
  CrearPlantillaContratoDto,
  { skipNullProperties: false },
) {}
