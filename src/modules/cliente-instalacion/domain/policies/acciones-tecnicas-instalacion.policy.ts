import { EstadoInstalacionCliente } from '../enums/estado-instalacion-cliente.enum';
import {
  InstalacionTecnicaAccion,
  InstalacionTecnicaAcciones,
} from '../read-models/instalacion-tecnica.read-model';

export type AccesoParaAcciones = {
  metodoAutenticacion: string;
  cuentaPppoe: unknown;
};

/** Qué puede hacer el técnico ahora, según el estado y los accesos de la instalación. */
export function calcularAccionesTecnicas(
  estado: EstadoInstalacionCliente,
  accesos: readonly AccesoParaAcciones[],
): InstalacionTecnicaAcciones {
  const puedeIniciar =
    estado === EstadoInstalacionCliente.PROGRAMADA ||
    estado === EstadoInstalacionCliente.REPROGRAMADA;
  const puedeCompletar = estado === EstadoInstalacionCliente.EN_PROCESO;
  const puedeCancelar = puedeIniciar || puedeCompletar;
  const tieneCuentaPppoe = accesos.some((a) => a.cuentaPppoe !== null);
  const requiereReintentoPrealta = accesos.some(
    (a) => a.metodoAutenticacion === 'PPPOE' && a.cuentaPppoe === null,
  );

  return {
    reprogramar: accion(
      puedeIniciar,
      'La instalación ya no puede reprogramarse en su estado actual.',
    ),
    iniciar: accion(
      puedeIniciar,
      'Solo se puede iniciar una instalación programada o reprogramada.',
    ),
    completar: accion(
      puedeCompletar,
      'La instalación debe estar en proceso antes de completarse.',
    ),
    cancelar: accion(puedeCancelar, 'La instalación ya no admite cancelación.'),
    subirEvidencia: accion(
      estado !== EstadoInstalacionCliente.CANCELADA,
      'No se pueden agregar evidencias a una instalación cancelada.',
    ),
    revelarCredenciales: accion(
      tieneCuentaPppoe,
      'La instalación no tiene una cuenta PPPoE preparada.',
    ),
    reintentarPrealta: accion(
      requiereReintentoPrealta,
      'No existen accesos PPPoE pendientes de prealta.',
    ),
  };
}

function accion(
  habilitada: boolean,
  motivoDeshabilitada: string,
): InstalacionTecnicaAccion {
  return { habilitada, motivo: habilitada ? null : motivoDeshabilitada };
}
