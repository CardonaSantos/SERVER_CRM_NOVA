import { EstadoCliente, EstadoServicioMikrotik } from '@prisma/client';

interface CalcularEstadoServicioMikrotikParams {
  estadoCliente: EstadoCliente;
  mikrotikRouterId: number | null;
}

/**
 * Regla de negocio:
 * - Si NO tiene Mikrotik asignado => SIN_MIKROTIK
 * - Si tiene Mikrotik:
 *    - ACTIVO, PENDIENTE_ACTIVO, EN_INSTALACION => ACTIVO
 *    - SUSPENDIDO, DESINSTALADO => SUSPENDIDO
 *    - Otros estados (financieros, etc) => mantenemos conservador: SUSPENDIDO o SIN_MIKROTIK según quieras
 */
export function calcularEstadoServicioMikrotik(
  params: CalcularEstadoServicioMikrotikParams,
): EstadoServicioMikrotik {
  const { estadoCliente, mikrotikRouterId } = params;

  // 1) Sin Mikrotik asignado
  if (!mikrotikRouterId) {
    return EstadoServicioMikrotik.SIN_MIKROTIK;
  }

  // 2) Con Mikrotik asignado → mapeamos por estado de cliente
  switch (estadoCliente) {
    case EstadoCliente.ACTIVO:
    case EstadoCliente.PENDIENTE_ACTIVO:
    case EstadoCliente.EN_INSTALACION:
      return EstadoServicioMikrotik.ACTIVO;

    case EstadoCliente.SUSPENDIDO:
    case EstadoCliente.DESINSTALADO:
      return EstadoServicioMikrotik.SUSPENDIDO;

    // Estados financieros u otros que no usas ahora
    default:
      // Si quieres ser ultra conservador:
      return EstadoServicioMikrotik.SUSPENDIDO;
  }
}
