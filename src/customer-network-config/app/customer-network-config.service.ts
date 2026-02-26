import { Inject, Injectable, Logger } from '@nestjs/common';
import { IpRepository, IPSymbol } from '../domain/ip.repository';
import { IP } from '../entities/customer-network-config.entity';
import { ClienteInternetService } from 'src/cliente-internet/cliente-internet.service';
import { UpdateCustomerNetworkConfigDto } from '../dto/update-customer-network-config.dto';
import { NetworkServiceService } from 'src/network-service/network-service.service';

@Injectable()
export class CustomerNetworkConfigService {
  constructor(
    @Inject(IPSymbol)
    private readonly ipRepo: IpRepository,
    private readonly clienteRepo: ClienteInternetService,
    private readonly networkService: NetworkServiceService,
  ) {}

  async execute(dto: UpdateCustomerNetworkConfigDto) {
    const cliente = await this.clienteRepo.findWithNetwork(dto.clienteId);
    if (!cliente) throw new Error('Cliente no encontrado');

    let ipActualizada: IP;

    if (cliente.IP && cliente.IP.id) {
      // === ESCENARIO ACTUALIZAR ===
      const ipDomain = IP.rehidratar({
        id: cliente.IP.id,
        direccionIp: dto.direccionIp,
        gateway: dto.gateway,
        mascara: dto.mascara,
        clienteId: cliente.id,
      });

      ipActualizada = await this.ipRepo.update(ipDomain);
    } else {
      // === ESCENARIO CREAR ===
      const ipDomain = IP.crear({
        direccionIp: dto.direccionIp,
        gateway: dto.gateway,
        mascara: dto.mascara,
        clienteId: cliente.id,
      });

      ipActualizada = await this.ipRepo.create(ipDomain);
    }
    // DES COMENTAR LUEGO
    // await this.networkService.syncCustomerNetwork(dto.clienteId);
    return ipActualizada;
  }
}
