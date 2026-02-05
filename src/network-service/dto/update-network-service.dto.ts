import { PartialType } from '@nestjs/mapped-types';
import { CreateNetworkServiceDto } from './create-network-service.dto';

export class UpdateNetworkServiceDto extends PartialType(CreateNetworkServiceDto) {}
