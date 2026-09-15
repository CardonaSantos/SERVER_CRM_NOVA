import { TicketSoporteHistorialTipo } from '../enums/ticket-soporte-historial-tipo.enum';

export type TicketSoporteHistorialProps = {
  id: number | null;
  ticketId: number;
  usuarioId: number | null;
  tipo: TicketSoporteHistorialTipo;
  descripcion: string | null;
  usuarioNombre: string | null;
  creadoEn: Date;
};

export type CrearTicketSoporteHistorialProps = Omit<
  TicketSoporteHistorialProps,
  'id' | 'creadoEn'
> & {
  creadoEn?: Date;
};

/**
 * Entidad append-only del historial de soporte.
 *
 * No expone métodos de update/delete porque una auditoría ya registrada
 * no debería mutarse desde el dominio.
 */
export class TicketSoporteHistorialEntity {
  private constructor(private readonly props: TicketSoporteHistorialProps) {}

  static create(
    props: CrearTicketSoporteHistorialProps,
  ): TicketSoporteHistorialEntity {
    if (!Number.isInteger(props.ticketId) || props.ticketId <= 0) {
      throw new Error('ticketId debe ser un entero positivo');
    }

    if (
      props.usuarioId !== null &&
      props.usuarioId !== undefined &&
      (!Number.isInteger(props.usuarioId) || props.usuarioId <= 0)
    ) {
      throw new Error('usuarioId debe ser null o un entero positivo');
    }

    const descripcion = TicketSoporteHistorialEntity.normalizarTexto(
      props.descripcion,
    );

    const usuarioNombre = TicketSoporteHistorialEntity.normalizarTexto(
      props.usuarioNombre,
    );

    return new TicketSoporteHistorialEntity({
      id: null,
      ticketId: props.ticketId,
      usuarioId: props.usuarioId ?? null,
      tipo: props.tipo,
      descripcion,
      usuarioNombre,
      creadoEn: props.creadoEn ?? new Date(),
    });
  }

  static rehydrate(
    props: TicketSoporteHistorialProps,
  ): TicketSoporteHistorialEntity {
    return new TicketSoporteHistorialEntity({
      ...props,
      descripcion: TicketSoporteHistorialEntity.normalizarTexto(
        props.descripcion,
      ),
      usuarioNombre: TicketSoporteHistorialEntity.normalizarTexto(
        props.usuarioNombre,
      ),
    });
  }

  private static normalizarTexto(value: string | null | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  get id() {
    return this.props.id;
  }

  get ticketId() {
    return this.props.ticketId;
  }

  get usuarioId() {
    return this.props.usuarioId;
  }

  get tipo() {
    return this.props.tipo;
  }

  get descripcion() {
    return this.props.descripcion;
  }

  get usuarioNombre() {
    return this.props.usuarioNombre;
  }

  get creadoEn() {
    return this.props.creadoEn;
  }
}
