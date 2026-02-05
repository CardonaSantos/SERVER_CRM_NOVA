import {
  Body,
  Controller,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { CustomerNetworkConfigService } from '../app/customer-network-config.service';
import { UpdateCustomerIpAndNetworkDto } from '../dto/create-customer-network-config.dto';
import { NetworkServiceService } from 'src/network-service/network-service.service';
@Controller('customer-network-config')
export class CustomerNetworkConfigController {
  private readonly logger = new Logger(CustomerNetworkConfigController.name);
  constructor(
    private readonly customerNetworkConfigService: CustomerNetworkConfigService,
    private readonly networkService: NetworkServiceService,
  ) {}

  @Patch('authorize-installation/:id')
  async authorize(@Param('id', ParseIntPipe) id: number) {
    await this.networkService.authorizeInstallation(id);
    return;
  }

  /**
   * Actualizar solo la IP del cliente, en la edicion de su perfil
   */
  @Patch('update-ip-mk')
  async updateIpAndMk(@Body() dto: UpdateCustomerIpAndNetworkDto) {
    const result = await this.customerNetworkConfigService.execute(dto);
    const id = result.getId();
    this.logger.log('El id del resultado es: ', id);
    await this.networkService.syncCustomerNetwork(result.getId());
    return result;
  }
}
