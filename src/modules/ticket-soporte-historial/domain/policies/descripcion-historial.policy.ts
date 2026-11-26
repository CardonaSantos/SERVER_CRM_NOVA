import { TicketSoporteHistorialTipo } from '../enums/ticket-soporte-historial-tipo.enum';
import {
  TicketHistorialCambio,
  TicketHistorialValor,
} from '../props/ticket-historial-cambio.props';

const ETIQUETAS_CAMPO: Record<string, string> = {
  titulo: 'Título',
  descripcion: 'Descripción',
  estado: 'Estado',
  prioridad: 'Prioridad',
  cliente: 'Cliente',
  tecnicoPrincipal: 'Técnico principal',
  tecnicosAdicionales: 'Técnicos adicionales',
  etiquetas: 'Etiquetas',
  fijado: 'Fijado',
  otro: 'Cambio',
};

const DESCRIPCION_POR_TIPO: Record<TicketSoporteHistorialTipo, string> = {
  [TicketSoporteHistorialTipo.CREADO]: 'Ticket creado',
  [TicketSoporteHistorialTipo.ACTUALIZADO]: 'Ticket actualizado',
  [TicketSoporteHistorialTipo.ESTADO_CAMBIADO]: 'Estado del ticket cambiado',
  [TicketSoporteHistorialTipo.PRIORIDAD_CAMBIADA]:
    'Prioridad del ticket cambiada',
  [TicketSoporteHistorialTipo.ASIGNACION_CAMBIADA]:
    'Asignación del ticket cambiada',
  [TicketSoporteHistorialTipo.CANCELADO]: 'Ticket cancelado',
  [TicketSoporteHistorialTipo.REABIERTO]: 'Ticket reabierto',
  [TicketSoporteHistorialTipo.FIJADO]: 'Ticket fijado',
  [TicketSoporteHistorialTipo.DESFIJADO]: 'Ticket desfijado',
};

const LARGO_MAXIMO_VALOR = 160;

export function descripcionPorDefecto(
  tipo: TicketSoporteHistorialTipo,
): string {
  return DESCRIPCION_POR_TIPO[tipo];
}

/** Un cambio cuenta solo si el valor nuevo difiere del anterior (las listas se comparan sin orden). */
export function hayCambioReal(cambio: TicketHistorialCambio): boolean {
  return valorComparable(cambio.anterior) !== valorComparable(cambio.nuevo);
}

export function soloCambiosReales(
  cambios: readonly TicketHistorialCambio[],
): TicketHistorialCambio[] {
  return cambios.filter(hayCambioReal);
}

/** Tipo de evento que describe mejor un conjunto de cambios reales. */
export function inferirTipoActualizacion(
  cambios: readonly TicketHistorialCambio[],
): TicketSoporteHistorialTipo {
  const estado = cambios.find((cambio) => cambio.campo === 'estado');

  if (estado) {
    if (estado.nuevo === 'CANCELADA') {
      return TicketSoporteHistorialTipo.CANCELADO;
    }

    if (estado.anterior === 'CANCELADA') {
      return TicketSoporteHistorialTipo.REABIERTO;
    }

    if (cambios.length === 1) {
      return TicketSoporteHistorialTipo.ESTADO_CAMBIADO;
    }
  }

  if (cambios.length === 1 && cambios[0].campo === 'prioridad') {
    return TicketSoporteHistorialTipo.PRIORIDAD_CAMBIADA;
  }

  if (
    cambios.every((cambio) =>
      ['tecnicoPrincipal', 'tecnicosAdicionales'].includes(cambio.campo),
    )
  ) {
    return TicketSoporteHistorialTipo.ASIGNACION_CAMBIADA;
  }

  if (cambios.length === 1 && cambios[0].campo === 'fijado') {
    return cambios[0].nuevo === true
      ? TicketSoporteHistorialTipo.FIJADO
      : TicketSoporteHistorialTipo.DESFIJADO;
  }

  return TicketSoporteHistorialTipo.ACTUALIZADO;
}

/**
 * Texto del evento: la base y, si hay cambios reales, `Campo: antes → después`
 * separados por " · ". El esquema no guarda JSON, así que el detalle vive aquí.
 */
export function construirDescripcionHistorial(
  base: string | null | undefined,
  cambios: readonly TicketHistorialCambio[],
): string {
  const prefijo = base?.trim() || 'Cambio registrado en ticket';

  const detalle = soloCambiosReales(cambios)
    .map((cambio) => {
      const etiqueta =
        cambio.etiqueta?.trim() ||
        ETIQUETAS_CAMPO[cambio.campo] ||
        cambio.campo;

      return `${etiqueta}: ${formatearValor(cambio.anterior)} → ${formatearValor(cambio.nuevo)}`;
    })
    .join(' · ');

  return detalle ? `${prefijo} · ${detalle}` : prefijo;
}

function valorComparable(valor: TicketHistorialValor): string {
  if (Array.isArray(valor)) {
    return JSON.stringify([...valor].map(String).sort());
  }

  return JSON.stringify(valor);
}

function formatearValor(valor: TicketHistorialValor): string {
  if (valor === null) return '—';

  if (Array.isArray(valor)) {
    if (valor.length === 0) return '[]';

    return `[${valor.map((item) => formatearValor(item)).join(', ')}]`;
  }

  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';

  const texto = String(valor).trim();

  if (!texto) return '—';

  // La bitácora no debe copiar textos enormes completos.
  return texto.length > LARGO_MAXIMO_VALOR
    ? `${texto.slice(0, LARGO_MAXIMO_VALOR - 3)}...`
    : texto;
}
