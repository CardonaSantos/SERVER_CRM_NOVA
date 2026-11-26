import { Body, Controller, Patch } from '@nestjs/common';
import { CustomerNetworkConfigService } from '../app/customer-network-config.service';
import { UpdateCustomerIpAndNetworkDto } from '../dto/create-customer-network-config.dto';
@Controller('customer-network-config')
export class CustomerNetworkConfigController {
  constructor(
    private readonly customerNetworkConfigService: CustomerNetworkConfigService,
  ) {}

  /**
   * Actualizar solo la IP del cliente, en la edicion de su perfil
   */
  @Patch('update-ip-mk')
  async updateIpAndMk(@Body() dto: UpdateCustomerIpAndNetworkDto) {
    return this.customerNetworkConfigService.execute(dto);
  }
}
