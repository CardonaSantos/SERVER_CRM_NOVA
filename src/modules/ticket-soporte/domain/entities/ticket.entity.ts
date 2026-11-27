import { EstadoTicket } from '../enums/estado-ticket.enum';
import { FaseTicket } from '../enums/fase-ticket.enum';
import { PrioridadTicket } from '../enums/prioridad-ticket.enum';
import {
  TicketInvalidoError,
  TicketSinTecnicoError,
} from '../errors/ticket-soporte.errors';
import { faseDe } from '../policies/fase-ticket.policy';
import {
  CambiosTicket,
  CrearTicketProps,
  TicketProps,
} from '../props/ticket.props';

export const LARGO_MAXIMO_TITULO = 300;
export const LARGO_MAXIMO_DESCRIPCION = 5000;
export const LARGO_MAXIMO_MOTIVO = 500;

function exigirTitulo(titulo: string): string {
  const limpio = titulo.trim();

  if (!limpio) throw new TicketInvalidoError('El título es obligatorio.');
  if (limpio.length > LARGO_MAXIMO_TITULO) {
    throw new TicketInvalidoError('El título es demasiado largo.');
  }

  return limpio;
}

function limpiarDescripcion(texto: string | null | undefined): string | null {
  const limpio = texto?.trim() || null;

  if (limpio && limpio.length > LARGO_MAXIMO_DESCRIPCION) {
    throw new TicketInvalidoError('La descripción es demasiado larga.');
  }

  return limpio;
}

function unicos(ids: number[]): number[] {
  return [...new Set(ids)];
}

export class TicketEntity {
  private constructor(private props: TicketProps) {}

  /** Nace abierto; si ya trae técnicos queda registrada su primera asignación. */
  static create(input: CrearTicketProps, ahora: Date): TicketEntity {
    const tecnicoId = input.tecnicoId ?? null;
    const apoyoIds = unicos(input.apoyoIds ?? []).filter(
      (id) => id !== tecnicoId,
    );

    return new TicketEntity({
      id: null,
      empresaId: input.empresaId,
      clienteId: input.clienteId ?? null,
      creadoPorId: input.creadoPorId ?? null,
      titulo: exigirTitulo(input.titulo),
      descripcion: limpiarDescripcion(input.descripcion),
      prioridad: input.prioridad ?? PrioridadTicket.MEDIA,
      estado: EstadoTicket.ABIERTA,
      fijado: input.fijado ?? false,
      tecnicoId,
      apoyoIds,
      etiquetaIds: unicos(input.etiquetaIds ?? []),
      fechaApertura: new Date(ahora),
      fechaAsignacion:
        tecnicoId !== null || apoyoIds.length > 0 ? new Date(ahora) : null,
      fechaInicioAtencion: null,
      fechaResolucionTecnico: null,
      fechaCierre: null,
      canceladoEn: null,
      canceladoPorId: null,
      motivoCancelacion: null,
      actualizadoEn: new Date(ahora),
    });
  }

  static hydrate(props: TicketProps): TicketEntity {
    if (props.id === null || props.id <= 0) {
      throw new TicketInvalidoError(
        'El ticket guardado no tiene identificador.',
      );
    }

    return new TicketEntity({
      ...props,
      apoyoIds: [...props.apoyoIds],
      etiquetaIds: [...props.etiquetaIds],
    });
  }

  get id(): number | null {
    return this.props.id;
  }

  get empresaId(): number | null {
    return this.props.empresaId;
  }

  get clienteId(): number | null {
    return this.props.clienteId;
  }

  get titulo(): string | null {
    return this.props.titulo;
  }

  get estado(): EstadoTicket {
    return this.props.estado;
  }

  get fase(): FaseTicket {
    return faseDe(this.props.estado);
  }

  get prioridad(): PrioridadTicket {
    return this.props.prioridad;
  }

  get tecnicoId(): number | null {
    return this.props.tecnicoId;
  }

  get fechaApertura(): Date {
    return new Date(this.props.fechaApertura);
  }

  /** Principal y apoyos, sin repetidos. */
  get asignados(): number[] {
    return this.props.tecnicoId === null
      ? [...this.props.apoyoIds]
      : [this.props.tecnicoId, ...this.props.apoyoIds];
  }

  estaAsignado(usuarioId: number): boolean {
    return this.asignados.includes(usuarioId);
  }

  editar(cambios: CambiosTicket, ahora: Date): void {
    const nuevo: TicketProps = { ...this.props };

    if (cambios.titulo !== undefined) {
      nuevo.titulo = exigirTitulo(cambios.titulo);
    }
    if (cambios.descripcion !== undefined) {
      nuevo.descripcion = limpiarDescripcion(cambios.descripcion);
    }
    if (cambios.prioridad !== undefined) nuevo.prioridad = cambios.prioridad;
    if (cambios.fijado !== undefined) nuevo.fijado = cambios.fijado;
    if (cambios.clienteId !== undefined) nuevo.clienteId = cambios.clienteId;
    if (cambios.tecnicoId !== undefined) nuevo.tecnicoId = cambios.tecnicoId;
    if (cambios.etiquetaIds !== undefined) {
      nuevo.etiquetaIds = unicos(cambios.etiquetaIds);
    }
    nuevo.apoyoIds = unicos(cambios.apoyoIds ?? nuevo.apoyoIds).filter(
      (id) => id !== nuevo.tecnicoId,
    );

    const sinAsignados = nuevo.tecnicoId === null && !nuevo.apoyoIds.length;

    if (sinAsignados && this.fase === FaseTicket.EN_PROCESO) {
      throw new TicketSinTecnicoError(
        'Devuelve el ticket a abierto antes de quitar a todos los técnicos.',
      );
    }
    if (!sinAsignados && nuevo.fechaAsignacion === null) {
      nuevo.fechaAsignacion = new Date(ahora);
    }

    nuevo.actualizadoEn = new Date(ahora);
    this.props = nuevo;
  }

  /** `fechaInicioAtencion` es la primera vez; cada tramo queda en los ciclos. */
  iniciar(ahora: Date): void {
    if (!this.asignados.length) throw new TicketSinTecnicoError();

    this.props.estado = EstadoTicket.EN_PROCESO;
    this.props.fechaInicioAtencion ??= new Date(ahora);
    this.tocar(ahora);
  }

  enviarARevision(ahora: Date): void {
    this.props.estado = EstadoTicket.PENDIENTE_REVISION;
    this.props.fechaResolucionTecnico = new Date(ahora);
    this.tocar(ahora);
  }

  devolver(ahora: Date): void {
    this.props.estado = EstadoTicket.ABIERTA;
    this.props.fechaResolucionTecnico = null;
    this.tocar(ahora);
  }

  /** @param huboTrabajo si existía un ciclo técnico que este cierre termina. */
  resolver(huboTrabajo: boolean, ahora: Date): void {
    if (huboTrabajo) {
      this.props.fechaResolucionTecnico ??= new Date(ahora);
    }
    this.props.estado = EstadoTicket.RESUELTA;
    this.props.fechaCierre = new Date(ahora);
    this.props.fijado = false;
    this.tocar(ahora);
  }

  cancelar(motivo: string, usuarioId: number, ahora: Date): void {
    const limpio = motivo.trim();

    if (!limpio) {
      throw new TicketInvalidoError('Escribe el motivo de la cancelación.');
    }
    if (limpio.length > LARGO_MAXIMO_MOTIVO) {
      throw new TicketInvalidoError('El motivo es demasiado largo.');
    }

    this.props.estado = EstadoTicket.CANCELADA;
    this.props.canceladoEn = new Date(ahora);
    this.props.canceladoPorId = usuarioId;
    this.props.motivoCancelacion = limpio;
    this.props.fijado = false;
    this.tocar(ahora);
  }

  /** Empieza un ciclo nuevo: las fechas de cierre anteriores quedan en el historial. */
  reabrir(ahora: Date): void {
    this.props.estado = EstadoTicket.ABIERTA;
    this.props.fechaCierre = null;
    this.props.fechaResolucionTecnico = null;
    this.props.canceladoEn = null;
    this.props.canceladoPorId = null;
    this.props.motivoCancelacion = null;
    this.tocar(ahora);
  }

  toPrimitives(): TicketProps {
    return {
      ...this.props,
      apoyoIds: [...this.props.apoyoIds],
      etiquetaIds: [...this.props.etiquetaIds],
    };
  }

  private tocar(ahora: Date): void {
    this.props.actualizadoEn = new Date(ahora);
  }
}
