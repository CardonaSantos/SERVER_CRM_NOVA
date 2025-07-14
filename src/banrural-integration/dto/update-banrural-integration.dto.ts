import { PartialType } from '@nestjs/mapped-types';
import { CreateBanruralIntegrationDto } from './create-banrural-integration.dto';

export class UpdateBanruralIntegrationDto extends PartialType(CreateBanruralIntegrationDto) {}
