import { Body, Controller, Delete, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { EliminarClienteUseCase } from '../../application/use-cases/eliminar-cliente.use-case';
import { EliminarClienteDto } from '../dto/eliminar-cliente.dto';
import { ClientePresenter } from '../presenters/cliente.presenter';

@ApiTags('clientes')
@Controller('internet-customer')
export class ClienteController {
  constructor(private readonly eliminarCliente: EliminarClienteUseCase) {}

  /** Borrado lógico: conserva facturas, pagos e historial. */
  @Delete('delete-one-customer/:id')
  async eliminar(
    @Param('id', ParseIntPipe) clienteId: number,
    @Body() dto: EliminarClienteDto,
    @Actor() actor: ActorHttp,
  ) {
    return ClientePresenter.eliminado(
      await this.eliminarCliente.execute({
        clienteId,
        usuarioId: actor.usuarioId,
        empresaId: actor.empresaId,
        motivo: dto?.motivo,
        comentario: dto?.comentario,
      }),
    );
  }
}
