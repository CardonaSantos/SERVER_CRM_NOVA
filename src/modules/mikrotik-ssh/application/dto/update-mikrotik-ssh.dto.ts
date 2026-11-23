import { PartialType } from '@nestjs/swagger';
import { CreateMikrotikSshDto } from './create-mikrotik-ssh.dto';

export class UpdateMikrotikSshDto extends PartialType(CreateMikrotikSshDto) {}
