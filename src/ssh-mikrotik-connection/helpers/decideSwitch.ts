import { EstadoCliente } from '@prisma/client';

export function decideSwitchMikrotikComand(estadoCliente: EstadoCliente) {
  switch (estadoCliente) {
    case 'ACTIVO':
      return true;

    case 'PENDIENTE_ACTIVO':
      return true;

    case 'ATRASADO':
      return true;

    case 'DESINSTALADO':
      return false;

    case 'SUSPENDIDO':
      return false;

    default:
      return true;
  }
}
