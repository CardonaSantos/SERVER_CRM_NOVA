import { EstadoCliente, EstadoServicioMikrotik } from '@prisma/client';

interface CalcularEstadoServicioMikrotikParams {
  estadoCliente: EstadoCliente;
  mikrotikRouterId: number | null;
  estadoServicioActual: EstadoServicioMikrotik;
}

/**
 * Reglas de negocio para estadoServicioMikrotik:
 *
 * 1) Si NO tiene Mikrotik asignado -> SIN_MIKROTIK
 *
 * 2) Si el cliente está DESINSTALADO -> SIN_MIKROTIK
 *    (a nivel red ya no deberíamos controlar nada)
 *
 * 3) Si el estado actual del servicio es SUSPENDIDO -> se respeta SUSPENDIDO
 *    (no "revivimos" el servicio solo porque se editó el cliente)
 *
 * 4) Con Mikrotik asignado y cliente no desinstalado:
 *      - ACTIVO, PENDIENTE_ACTIVO, EN_INSTALACION -> ACTIVO
 *      - SUSPENDIDO -> SUSPENDIDO
 *      - Otros (MOROSO, etc.) -> conservador: SUSPENDIDO
 */
export function calcularEstadoServicioMikrotik({
  estadoCliente,
  mikrotikRouterId,
  estadoServicioActual,
}: CalcularEstadoServicioMikrotikParams): EstadoServicioMikrotik {
  // 1) Sin Mikrotik asignado
  if (!mikrotikRouterId) {
    return EstadoServicioMikrotik.SIN_MIKROTIK;
  }

  // 2) Cliente desinstalado -> ya no controlamos servicio en Mikrotik
  if (estadoCliente === EstadoCliente.DESINSTALADO) {
    return EstadoServicioMikrotik.SIN_MIKROTIK;
  }

  // 3) Si el servicio YA está marcado como SUSPENDIDO, lo respetamos
  //    (por ejemplo, lo suspendiste via SSH y luego solo editaste datos del cliente)
  if (estadoServicioActual === EstadoServicioMikrotik.SUSPENDIDO) {
    return EstadoServicioMikrotik.SUSPENDIDO;
  }

  // 4) Con Mikrotik asignado y cliente no desinstalado → mapeamos por estadoCliente
  switch (estadoCliente) {
    case EstadoCliente.ACTIVO:
    case EstadoCliente.PENDIENTE_ACTIVO:
    case EstadoCliente.EN_INSTALACION:
      return EstadoServicioMikrotik.ACTIVO;

    case EstadoCliente.SUSPENDIDO:
      // Estado de cliente "suspendido" -> cortamos servicio en Mikrotik
      return EstadoServicioMikrotik.SUSPENDIDO;

    // Estados "financieros" / raros (MOROSO, etc.) → mejor cortar el servicio
    default:
      return EstadoServicioMikrotik.SUSPENDIDO;
  }
}
