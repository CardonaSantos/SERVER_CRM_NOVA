import { PartialType } from '@nestjs/swagger';
import { CreateNetworkServiceDto } from './create-network-service.dto';

export class UpdateNetworkServiceDto extends PartialType(CreateNetworkServiceDto) {}
