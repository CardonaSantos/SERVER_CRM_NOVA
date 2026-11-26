import { EstadoCliente, EstadoCobranzaCliente, Prisma } from '@prisma/client';

/**
 * Clientes con cierto estado de cobranza. La cobranza vive en `estadoCobranza`
 * (no en el estado operativo) y los desinstalados no se cuentan.
 */
export function conCobranza(
  estado: EstadoCobranzaCliente,
): Prisma.ClienteInternetWhereInput {
  return {
    estadoCobranza: estado,
    estadoCliente: { not: EstadoCliente.DESINSTALADO },
  };
}
