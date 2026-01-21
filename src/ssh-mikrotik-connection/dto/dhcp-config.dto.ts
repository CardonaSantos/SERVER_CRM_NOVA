import { EstadoCliente } from '@prisma/client';

export class DhcpConfigDto {
  clienteId: number;
  userId: number;
  estadoCliente: EstadoCliente;
  password: string;
}
