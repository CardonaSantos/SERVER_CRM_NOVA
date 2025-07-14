import { EstadoCliente } from '@prisma/client';

export function calculateEstadoCliente(n: number): EstadoCliente {
  if (n === 0) return 'ACTIVO';
  if (n === 1) return 'PENDIENTE_ACTIVO';
  if (n === 2) return 'ATRASADO';
  return 'MOROSO'; // cubre n >= 3
}
