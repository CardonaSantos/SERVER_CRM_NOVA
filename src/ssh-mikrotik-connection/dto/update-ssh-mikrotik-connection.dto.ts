import { PartialType } from '@nestjs/swagger';
import { SuspendCustomerDto } from './create-ssh-mikrotik-connection.dto';

export class UpdateSshMikrotikConnectionDto extends PartialType(
  SuspendCustomerDto,
) {}
