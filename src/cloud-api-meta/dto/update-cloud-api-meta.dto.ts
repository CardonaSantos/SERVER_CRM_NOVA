import { PartialType } from '@nestjs/swagger';
import { CreateCloudApiMetaDto } from './create-cloud-api-meta.dto';

export class UpdateCloudApiMetaDto extends PartialType(CreateCloudApiMetaDto) {}
