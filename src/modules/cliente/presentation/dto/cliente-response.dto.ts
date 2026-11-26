import { EstadoCobranzaCliente } from '../../domain/enums/estado-cobranza-cliente.enum';
import { EstadoClientePersistido } from '../../domain/enums/estado-operativo-cliente.enum';

export class ClienteGuardadoResponseDto {
  id: number;
  nombre: string;
  apellidos: string | null;
  estadoCliente: EstadoClientePersistido;
  estadoCobranza: EstadoCobranzaCliente;

  /** ISO 8601. */
  actualizadoEn: string;
}

export class IpClienteResponseDto {
  id: number;
  clienteId: number;
  direccionIp: string | null;
  gateway: string | null;
  mascara: string | null;
}

export class ClienteEliminadoResponseDto {
  clienteId: number;

  /** ISO 8601. */
  eliminadoEn: string;
}
