import { PartialType } from '@nestjs/mapped-types';
import { CreateMikrotikRouterCredentialDto } from './create-mikrotik-router-credential.dto';

export class UpdateMikrotikRouterCredentialDto extends PartialType(CreateMikrotikRouterCredentialDto) {}
