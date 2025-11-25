import { PartialType } from '@nestjs/mapped-types';
import { SuspendCustomerDto } from './create-ssh-mikrotik-connection.dto';

export class UpdateSshMikrotikConnectionDto extends PartialType(
  SuspendCustomerDto,
) {}
