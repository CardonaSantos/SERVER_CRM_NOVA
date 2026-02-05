import { PartialType } from '@nestjs/mapped-types';
import { CreatePlantillaLegalDto } from './create-plantilla-legal.dto';

export class UpdatePlantillaLegalDto extends PartialType(CreatePlantillaLegalDto) {}
