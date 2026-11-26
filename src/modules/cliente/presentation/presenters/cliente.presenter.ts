import { EliminarClienteResult } from '../../application/use-cases/eliminar-cliente.use-case';
import { ClienteEntity } from '../../domain/entities/cliente.entity';
import { IpClienteReadModel } from '../../domain/read-models/ip-cliente.read-model';
import {
  ClienteEliminadoResponseDto,
  ClienteGuardadoResponseDto,
  IpClienteResponseDto,
} from '../dto/cliente-response.dto';

export class ClientePresenter {
  static guardado(cliente: ClienteEntity): ClienteGuardadoResponseDto {
    const p = cliente.toPrimitives();

    return {
      id: p.id!,
      nombre: p.nombre,
      apellidos: p.apellidos,
      estadoCliente: p.estadoCliente,
      estadoCobranza: p.estadoCobranza,
      actualizadoEn: p.actualizadoEn.toISOString(),
    };
  }

  static ip(ip: IpClienteReadModel): IpClienteResponseDto {
    return {
      id: ip.id,
      clienteId: ip.clienteId,
      direccionIp: ip.direccionIp,
      gateway: ip.gateway,
      mascara: ip.mascara,
    };
  }

  static eliminado(r: EliminarClienteResult): ClienteEliminadoResponseDto {
    return {
      clienteId: r.clienteId,
      eliminadoEn: r.eliminadoEn.toISOString(),
    };
  }
}
