import { EliminarClienteResult } from '../../application/use-cases/eliminar-cliente.use-case';
import { ClienteEliminadoResponseDto } from '../dto/cliente-response.dto';

export class ClientePresenter {
  static eliminado(r: EliminarClienteResult): ClienteEliminadoResponseDto {
    return {
      clienteId: r.clienteId,
      eliminadoEn: r.eliminadoEn.toISOString(),
    };
  }
}
