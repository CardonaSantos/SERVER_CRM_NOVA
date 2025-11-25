import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SuspendCustomerDto } from '../dto/create-ssh-mikrotik-connection.dto';
import { UpdateSshMikrotikConnectionDto } from '../dto/update-ssh-mikrotik-connection.dto';
import { SshMikrotikConnectionService } from '../application/ssh-mikrotik-connection.service';
import { ActivateCustomerDto } from '../dto/activate-ssh-mikrotik.dto';

@Controller('ssh-mikrotik-connection')
export class SshMikrotikConnectionController {
  constructor(private readonly mikrotikService: SshMikrotikConnectionService) {}

  // SUSPENDER
  @Post('suspend-customer')
  async suspendCustomer(@Body() dto: SuspendCustomerDto) {
    const res = await this.mikrotikService.suspendCustomer(dto);
    return res;
  }
  // ACTIVAR
  @Post('activate-customer')
  async activateCustomer(@Body() dto: ActivateCustomerDto) {
    const res = await this.mikrotikService.activateCustomer(dto);
    return res;
  }
}
