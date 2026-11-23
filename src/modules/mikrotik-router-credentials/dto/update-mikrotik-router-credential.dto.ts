import { PartialType } from '@nestjs/swagger';
import { CreateMikrotikRouterCredentialDto } from './create-mikrotik-router-credential.dto';

export class UpdateMikrotikRouterCredentialDto extends PartialType(CreateMikrotikRouterCredentialDto) {}
