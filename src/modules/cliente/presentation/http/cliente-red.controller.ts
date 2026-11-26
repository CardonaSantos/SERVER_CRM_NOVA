import { Body, Controller, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ActualizarIpClienteUseCase } from '../../application/use-cases/actualizar-ip-cliente.use-case';
import { ActualizarIpClienteDto } from '../dto/actualizar-ip-cliente.dto';
import { ClientePresenter } from '../presenters/cliente.presenter';

@ApiTags('clientes')
@Controller('customer-network-config')
export class ClienteRedController {
  constructor(private readonly actualizarIp: ActualizarIpClienteUseCase) {}

  /** Cambia solo la IP registrada del cliente; no toca el router. */
  @Patch('update-ip-mk')
  async actualizar(@Body() dto: ActualizarIpClienteDto) {
    return ClientePresenter.ip(
      await this.actualizarIp.execute({
        clienteId: dto.clienteId,
        direccionIp: dto.direccionIp,
        gateway: dto.gateway,
        mascara: dto.mascara,
      }),
    );
  }
}
