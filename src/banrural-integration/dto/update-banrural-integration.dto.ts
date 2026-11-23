import { PartialType } from '@nestjs/swagger';
import { CreateBanruralIntegrationDto } from './create-banrural-integration.dto';

export class UpdateBanruralIntegrationDto extends PartialType(CreateBanruralIntegrationDto) {}
