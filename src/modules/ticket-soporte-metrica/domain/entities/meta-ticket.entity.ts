import {
  MetaTicketCanceladaError,
  MetaTicketInvalidaError,
} from '../errors/ticket-soporte-metrica.errors';
import { esFecha } from '../policies/fechas.policy';
import {
  CambiosMetaTicket,
  CrearMetaTicketProps,
  MetaTicketProps,
} from '../props/meta-ticket.props';

export const OBJETIVO_MAXIMO = 10_000;
export const TITULO_MAXIMO = 150;

export class MetaTicketEntity {
  private constructor(private props: MetaTicketProps) {}

  static create(input: CrearMetaTicketProps, ahora: Date): MetaTicketEntity {
    const props: MetaTicketProps = {
      id: null,
      tecnicoId: input.tecnicoId,
      titulo: limpiarTitulo(input.titulo),
      fechaInicio: input.fechaInicio,
      fechaFin: input.fechaFin,
      objetivo: input.objetivo,
      cancelada: false,
      creadoEn: ahora,
      actualizadoEn: ahora,
    };
    validar(props);

    return new MetaTicketEntity(props);
  }

  /** No valida reglas de creación: hay metas antiguas que no las cumplen. */
  static hydrate(props: MetaTicketProps): MetaTicketEntity {
    return new MetaTicketEntity({ ...props });
  }

  /** El técnico no cambia: se cancela la meta y se crea otra. */
  editar(cambios: CambiosMetaTicket, ahora: Date): void {
    this.exigirVigente();

    const nuevas: MetaTicketProps = {
      ...this.props,
      titulo:
        cambios.titulo === undefined
          ? this.props.titulo
          : limpiarTitulo(cambios.titulo),
      fechaInicio: cambios.fechaInicio ?? this.props.fechaInicio,
      fechaFin: cambios.fechaFin ?? this.props.fechaFin,
      objetivo: cambios.objetivo ?? this.props.objetivo,
      actualizadoEn: ahora,
    };
    validar(nuevas);
    this.props = nuevas;
  }

  cancelar(ahora: Date): void {
    this.exigirVigente();
    this.props.cancelada = true;
    this.props.actualizadoEn = ahora;
  }

  get id(): number | null {
    return this.props.id;
  }

  get tecnicoId(): number {
    return this.props.tecnicoId;
  }

  get fechaInicio(): string {
    return this.props.fechaInicio;
  }

  get fechaFin(): string {
    return this.props.fechaFin;
  }

  toPrimitives(): MetaTicketProps {
    return { ...this.props };
  }

  private exigirVigente(): void {
    if (this.props.cancelada) throw new MetaTicketCanceladaError();
  }
}

function limpiarTitulo(titulo: string | null | undefined): string | null {
  return titulo?.trim() || null;
}

function validar(props: MetaTicketProps): void {
  if (!esFecha(props.fechaInicio) || !esFecha(props.fechaFin)) {
    throw new MetaTicketInvalidaError('Las fechas de la meta no son válidas.');
  }

  if (props.fechaFin < props.fechaInicio) {
    throw new MetaTicketInvalidaError(
      'La fecha final no puede ser anterior a la inicial.',
    );
  }

  if (
    !Number.isInteger(props.objetivo) ||
    props.objetivo < 1 ||
    props.objetivo > OBJETIVO_MAXIMO
  ) {
    throw new MetaTicketInvalidaError(
      `La meta debe estar entre 1 y ${OBJETIVO_MAXIMO} tickets.`,
    );
  }

  if (props.titulo && props.titulo.length > TITULO_MAXIMO) {
    throw new MetaTicketInvalidaError(
      `El título admite hasta ${TITULO_MAXIMO} caracteres.`,
    );
  }
}
