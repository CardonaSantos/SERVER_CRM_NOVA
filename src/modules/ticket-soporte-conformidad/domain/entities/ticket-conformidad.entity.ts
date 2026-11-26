import { TicketConformidadResultado } from '../enums/ticket-conformidad-resultado.enum';
import {
  TicketConformidadDatosInvalidosError,
  TicketConformidadEstadoInvalidoError,
} from '../errors/ticket-soporte-conformidad.errors';
import {
  CrearTicketConformidadProps,
  TicketConformidadProps,
} from '../props/ticket-conformidad.props';

/**
 * Un ciclo de conformidad de un ticket: nace PENDIENTE y se responde una sola
 * vez (CONFORME o REQUIERE_RETRABAJO).
 */
export class TicketConformidadEntity {
  private constructor(private readonly props: TicketConformidadProps) {}

  static create(
    input: CrearTicketConformidadProps,
    ahora: Date,
  ): TicketConformidadEntity {
    assertIdPositivo(input.ticketId, 'ticketId');
    assertIdOpcional(input.clienteId, 'clienteId');
    assertIdOpcional(input.tecnicoAsignadoId, 'tecnicoAsignadoId');
    assertIdOpcional(input.creadoPorId, 'creadoPorId');
    assertFechaValida(ahora, 'fecha');

    return new TicketConformidadEntity({
      id: null,
      ticketId: input.ticketId,
      clienteId: input.clienteId ?? null,
      tecnicoAsignadoId: input.tecnicoAsignadoId ?? null,
      creadoPorId: input.creadoPorId ?? null,
      resultado: TicketConformidadResultado.PENDIENTE,
      creadoEn: new Date(ahora),
      actualizadoEn: new Date(ahora),
      respondidoEn: null,
    });
  }

  /** Reconstruye desde persistencia: valida consistencia, no genera fechas ni estados. */
  static hydrate(props: TicketConformidadProps): TicketConformidadEntity {
    assertIdPositivo(props.id, 'id');
    assertIdPositivo(props.ticketId, 'ticketId');
    assertIdOpcional(props.clienteId, 'clienteId');
    assertIdOpcional(props.tecnicoAsignadoId, 'tecnicoAsignadoId');
    assertIdOpcional(props.creadoPorId, 'creadoPorId');
    assertFechaValida(props.creadoEn, 'creadoEn');
    assertFechaValida(props.actualizadoEn, 'actualizadoEn');

    if (props.respondidoEn) {
      assertFechaValida(props.respondidoEn, 'respondidoEn');
    }

    const pendiente = props.resultado === TicketConformidadResultado.PENDIENTE;

    if (pendiente && props.respondidoEn !== null) {
      throw new TicketConformidadDatosInvalidosError(
        'Una conformidad pendiente no puede tener fecha de respuesta.',
      );
    }

    if (!pendiente && props.respondidoEn === null) {
      throw new TicketConformidadDatosInvalidosError(
        'Una conformidad respondida debe tener fecha de respuesta.',
      );
    }

    return new TicketConformidadEntity({
      ...props,
      creadoEn: new Date(props.creadoEn),
      actualizadoEn: new Date(props.actualizadoEn),
      respondidoEn: props.respondidoEn ? new Date(props.respondidoEn) : null,
    });
  }

  /** El cliente quedó conforme; se llama después de guardar su firma. */
  marcarConforme(fecha: Date): void {
    this.responder(TicketConformidadResultado.CONFORME, fecha);
  }

  /** El cliente indicó que el trabajo no es conforme. */
  requerirRetrabajo(fecha: Date): void {
    this.responder(TicketConformidadResultado.REQUIERE_RETRABAJO, fecha);
  }

  estaPendiente(): boolean {
    return this.props.resultado === TicketConformidadResultado.PENDIENTE;
  }

  estaConforme(): boolean {
    return this.props.resultado === TicketConformidadResultado.CONFORME;
  }

  requiereRetrabajo(): boolean {
    return (
      this.props.resultado === TicketConformidadResultado.REQUIERE_RETRABAJO
    );
  }

  get id(): number | null {
    return this.props.id;
  }

  get ticketId(): number {
    return this.props.ticketId;
  }

  get clienteId(): number | null {
    return this.props.clienteId;
  }

  get tecnicoAsignadoId(): number | null {
    return this.props.tecnicoAsignadoId;
  }

  get creadoPorId(): number | null {
    return this.props.creadoPorId;
  }

  get resultado(): TicketConformidadResultado {
    return this.props.resultado;
  }

  get creadoEn(): Date {
    return new Date(this.props.creadoEn);
  }

  get actualizadoEn(): Date {
    return new Date(this.props.actualizadoEn);
  }

  get respondidoEn(): Date | null {
    return this.props.respondidoEn ? new Date(this.props.respondidoEn) : null;
  }

  toPrimitives(): TicketConformidadProps {
    return {
      ...this.props,
      creadoEn: new Date(this.props.creadoEn),
      actualizadoEn: new Date(this.props.actualizadoEn),
      respondidoEn: this.respondidoEn,
    };
  }

  private responder(resultado: TicketConformidadResultado, fecha: Date): void {
    if (!this.estaPendiente()) {
      throw new TicketConformidadEstadoInvalidoError(
        'La conformidad ya fue respondida y no puede modificarse.',
      );
    }

    assertFechaValida(fecha, 'fecha');

    this.props.resultado = resultado;
    this.props.respondidoEn = new Date(fecha);
    this.props.actualizadoEn = new Date(fecha);
  }
}

function assertIdPositivo(valor: number | null, campo: string): void {
  if (valor === null || !Number.isInteger(valor) || valor <= 0) {
    throw new TicketConformidadDatosInvalidosError(
      `El dato ${campo} no es válido.`,
    );
  }
}

function assertIdOpcional(
  valor: number | null | undefined,
  campo: string,
): void {
  if (valor === null || valor === undefined) return;

  assertIdPositivo(valor, campo);
}

function assertFechaValida(valor: Date, campo: string): void {
  if (!(valor instanceof Date) || Number.isNaN(valor.getTime())) {
    throw new TicketConformidadDatosInvalidosError(
      `La fecha ${campo} no es válida.`,
    );
  }
}
