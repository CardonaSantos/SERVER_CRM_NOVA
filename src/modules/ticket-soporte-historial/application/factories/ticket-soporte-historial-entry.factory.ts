import { TicketSoporteHistorialEntity } from '../../domain/entities/ticket-soporte-historial.entity';
import { TicketSoporteHistorialTipo } from '../../domain/enums/ticket-soporte-historial-tipo.enum';
import {
  TicketHistorialCambio,
  TicketHistorialValor,
} from '../../domain/types/ticket-historial-cambio.type';
import { RegistrarActualizacionTicketCommand } from '../contracts/registrar-actualizacion-ticket.command';
import { RegistrarTicketHistorialCommand } from '../contracts/registrar-ticket-historial.command';

const CAMPO_LABELS: Record<string, string> = {
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

const DEFAULT_DESCRIPTIONS: Record<TicketSoporteHistorialTipo, string> = {
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

/**
 * Convierte comandos tipados a una entidad persistible.
 *
 * Como el schema actual ya no guarda JSON, la lista `cambios`
 * se serializa de forma humana y estable dentro de `descripcion`.
 */
export class TicketSoporteHistorialEntryFactory {
  static fromEvento(
    command: RegistrarTicketHistorialCommand,
  ): TicketSoporteHistorialEntity {
    const descripcion = this.construirDescripcion(
      command.descripcion ?? DEFAULT_DESCRIPTIONS[command.tipo],
      command.cambios ?? [],
    );

    return TicketSoporteHistorialEntity.create({
      ticketId: command.ticketId,
      usuarioId: command.actor?.usuarioId ?? null,
      usuarioNombre: command.actor?.usuarioNombre ?? 'Sistema',
      tipo: command.tipo,
      descripcion,
    });
  }

  static fromActualizacion(
    command: RegistrarActualizacionTicketCommand,
  ): TicketSoporteHistorialEntity | null {
    const cambios = command.cambios.filter((cambio) =>
      this.hayCambioReal(cambio),
    );

    if (cambios.length === 0) {
      return null;
    }

    const tipo = this.inferirTipo(cambios);

    return TicketSoporteHistorialEntity.create({
      ticketId: command.ticketId,
      usuarioId: command.actor?.usuarioId ?? null,
      usuarioNombre: command.actor?.usuarioNombre ?? 'Sistema',
      tipo,
      descripcion: this.construirDescripcion(
        command.descripcion ?? DEFAULT_DESCRIPTIONS[tipo],
        cambios,
      ),
    });
  }

  private static inferirTipo(
    cambios: readonly TicketHistorialCambio[],
  ): TicketSoporteHistorialTipo {
    const estado = cambios.find((cambio) => cambio.campo === 'estado');

    if (estado) {
      if (estado.nuevo === 'CANCELADA') {
        return TicketSoporteHistorialTipo.CANCELADO;
      }

      if (estado.anterior === 'CANCELADA' && estado.nuevo !== 'CANCELADA') {
        return TicketSoporteHistorialTipo.REABIERTO;
      }

      if (cambios.length === 1) {
        return TicketSoporteHistorialTipo.ESTADO_CAMBIADO;
      }
    }

    if (
      cambios.length === 1 &&
      cambios[0].campo === 'prioridad'
    ) {
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

  private static construirDescripcion(
    base: string | null | undefined,
    cambios: readonly TicketHistorialCambio[],
  ): string {
    const prefix = base?.trim() || 'Cambio registrado en ticket';

    if (cambios.length === 0) {
      return prefix;
    }

    const detalle = cambios
      .filter((cambio) => this.hayCambioReal(cambio))
      .map((cambio) => {
        const label =
          cambio.etiqueta?.trim() || CAMPO_LABELS[cambio.campo] || cambio.campo;

        return `${label}: ${this.formatearValor(cambio.anterior)} → ${this.formatearValor(cambio.nuevo)}`;
      })
      .join(' · ');

    return detalle ? `${prefix} · ${detalle}` : prefix;
  }

  private static hayCambioReal(cambio: TicketHistorialCambio): boolean {
    return this.valorComparable(cambio.anterior) !== this.valorComparable(cambio.nuevo);
  }

  private static valorComparable(value: TicketHistorialValor): string {
    if (Array.isArray(value)) {
      return JSON.stringify([...value].map(String).sort());
    }

    return JSON.stringify(value);
  }

  private static formatearValor(value: TicketHistorialValor): string {
    if (value === null) {
      return '—';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '[]';
      }

      return `[${value.map((item) => this.formatearValor(item)).join(', ')}]`;
    }

    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    const stringValue = String(value).trim();

    if (!stringValue) {
      return '—';
    }

    // Evita convertir la bitácora en una copia completa de textos enormes.
    return stringValue.length > 160
      ? `${stringValue.slice(0, 157)}...`
      : stringValue;
  }
}
