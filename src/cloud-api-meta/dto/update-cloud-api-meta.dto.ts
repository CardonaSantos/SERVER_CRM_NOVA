import { PartialType } from '@nestjs/mapped-types';
import { CreateCloudApiMetaDto } from './create-cloud-api-meta.dto';

export class UpdateCloudApiMetaDto extends PartialType(CreateCloudApiMetaDto) {}
