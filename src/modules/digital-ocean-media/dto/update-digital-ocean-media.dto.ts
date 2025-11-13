import { PartialType } from '@nestjs/mapped-types';
import { CreateDigitalOceanMediaDto } from './create-digital-ocean-media.dto';

export class UpdateDigitalOceanMediaDto extends PartialType(CreateDigitalOceanMediaDto) {}
