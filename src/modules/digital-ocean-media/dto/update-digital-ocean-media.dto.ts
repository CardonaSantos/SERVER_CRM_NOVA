import { PartialType } from '@nestjs/swagger';
import { CreateDigitalOceanMediaDto } from './create-digital-ocean-media.dto';

export class UpdateDigitalOceanMediaDto extends PartialType(CreateDigitalOceanMediaDto) {}
