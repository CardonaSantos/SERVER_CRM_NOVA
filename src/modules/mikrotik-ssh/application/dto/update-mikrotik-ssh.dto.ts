import { PartialType } from '@nestjs/mapped-types';
import { CreateMikrotikSshDto } from './create-mikrotik-ssh.dto';

export class UpdateMikrotikSshDto extends PartialType(CreateMikrotikSshDto) {}
