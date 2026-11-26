import { TicketSoporteHistorialDatosInvalidosError } from '../errors/ticket-soporte-historial.errors';
import {
  CrearTicketSoporteHistorialProps,
  TicketSoporteHistorialProps,
} from '../props/ticket-soporte-historial.props';

/**
 * Entrada append-only del historial de un ticket: no tiene transiciones
 * porque una auditoría ya registrada no se modifica.
 */
export class TicketSoporteHistorialEntity {
  private constructor(private readonly props: TicketSoporteHistorialProps) {}

  static create(
    input: CrearTicketSoporteHistorialProps,
    ahora: Date,
  ): TicketSoporteHistorialEntity {
    if (!esEnteroPositivo(input.ticketId)) {
      throw new TicketSoporteHistorialDatosInvalidosError(
        'El ticket del historial no es válido.',
      );
    }

    const usuarioId = input.usuarioId ?? null;

    if (usuarioId !== null && !esEnteroPositivo(usuarioId)) {
      throw new TicketSoporteHistorialDatosInvalidosError(
        'El usuario del historial no es válido.',
      );
    }

    return new TicketSoporteHistorialEntity({
      id: null,
      ticketId: input.ticketId,
      usuarioId,
      tipo: input.tipo,
      descripcion: normalizarTexto(input.descripcion),
      usuarioNombre: normalizarTexto(input.usuarioNombre),
      creadoEn: new Date(ahora),
    });
  }

  static hydrate(
    props: TicketSoporteHistorialProps,
  ): TicketSoporteHistorialEntity {
    return new TicketSoporteHistorialEntity({
      ...props,
      descripcion: normalizarTexto(props.descripcion),
      usuarioNombre: normalizarTexto(props.usuarioNombre),
      creadoEn: new Date(props.creadoEn),
    });
  }

  get id(): number | null {
    return this.props.id;
  }

  get ticketId(): number {
    return this.props.ticketId;
  }

  get usuarioId(): number | null {
    return this.props.usuarioId;
  }

  get tipo() {
    return this.props.tipo;
  }

  get descripcion(): string | null {
    return this.props.descripcion;
  }

  get usuarioNombre(): string | null {
    return this.props.usuarioNombre;
  }

  get creadoEn(): Date {
    return new Date(this.props.creadoEn);
  }

  toPrimitives(): TicketSoporteHistorialProps {
    return { ...this.props, creadoEn: new Date(this.props.creadoEn) };
  }
}

function esEnteroPositivo(valor: number): boolean {
  return Number.isInteger(valor) && valor > 0;
}

function normalizarTexto(valor: string | null | undefined): string | null {
  const recortado = valor?.trim();

  return recortado ? recortado : null;
}
