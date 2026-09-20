import { TicketConformidadResultado } from '../enums/ticket-conformidad-resultado.enum';
import {
  CrearTicketConformidadEntityProps,
  TicketConformidadEntityProps,
} from './entities-props.props';

export class TicketConformidadEntity {
  private constructor(private readonly props: TicketConformidadEntityProps) {}

  /* =========================================================
   * FACTORIES
   * ======================================================= */

  static create(
    input: CrearTicketConformidadEntityProps,
  ): TicketConformidadEntity {
    this.assertPositiveId(input.ticketId, 'ticketId');

    this.assertOptionalPositiveId(input.clienteId, 'clienteId');

    this.assertOptionalPositiveId(input.tecnicoAsignadoId, 'tecnicoAsignadoId');

    this.assertOptionalPositiveId(input.creadoPorId, 'creadoPorId');

    const now = new Date();

    return new TicketConformidadEntity({
      id: null,

      ticketId: input.ticketId,

      clienteId: input.clienteId ?? null,
      tecnicoAsignadoId: input.tecnicoAsignadoId ?? null,
      creadoPorId: input.creadoPorId ?? null,

      resultado: TicketConformidadResultado.PENDIENTE,

      creadoEn: now,
      actualizadoEn: now,
      respondidoEn: null,
    });
  }

  /**
   * Reconstruye una entidad proveniente de persistencia.
   *
   * Este método es el punto de entrada que utilizará el PrismaMapper.
   * No genera fechas ni estados nuevos.
   */
  static rehydrate(
    props: TicketConformidadEntityProps,
  ): TicketConformidadEntity {
    this.assertPositiveId(props.id, 'id');

    this.assertPositiveId(props.ticketId, 'ticketId');

    this.assertOptionalPositiveId(props.clienteId, 'clienteId');

    this.assertOptionalPositiveId(props.tecnicoAsignadoId, 'tecnicoAsignadoId');

    this.assertOptionalPositiveId(props.creadoPorId, 'creadoPorId');

    this.assertValidDate(props.creadoEn, 'creadoEn');
    this.assertValidDate(props.actualizadoEn, 'actualizadoEn');

    if (props.respondidoEn) {
      this.assertValidDate(props.respondidoEn, 'respondidoEn');
    }

    this.assertPersistenceState(props);

    return new TicketConformidadEntity({
      ...props,
    });
  }

  /* =========================================================
   * COMPORTAMIENTO
   * ======================================================= */

  /**
   * Marca la solicitud como conforme.
   *
   * IMPORTANTE:
   * este método debe llamarse únicamente después de que la firma
   * del cliente haya sido persistida correctamente.
   */
  marcarConforme(fecha: Date = new Date()): void {
    this.assertPendiente();

    TicketConformidadEntity.assertValidDate(fecha, 'fecha');

    this.props.resultado = TicketConformidadResultado.CONFORME;
    this.props.respondidoEn = fecha;
    this.props.actualizadoEn = fecha;
  }

  /**
   * El cliente indicó que el trabajo no es conforme.
   */
  requerirRetrabajo(fecha: Date = new Date()): void {
    this.assertPendiente();

    TicketConformidadEntity.assertValidDate(fecha, 'fecha');

    this.props.resultado = TicketConformidadResultado.REQUIERE_RETRABAJO;

    this.props.respondidoEn = fecha;
    this.props.actualizadoEn = fecha;
  }

  /* =========================================================
   * CONSULTAS DE DOMINIO
   * ======================================================= */

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

  fueRespondida(): boolean {
    return this.props.respondidoEn !== null;
  }

  /* =========================================================
   * MAPPER / SERIALIZACIÓN DE DOMINIO
   * ======================================================= */

  toPrimitives(): TicketConformidadEntityProps {
    return {
      ...this.props,
    };
  }

  /* =========================================================
   * GETTERS
   * ======================================================= */

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
    return this.props.creadoEn;
  }

  get actualizadoEn(): Date {
    return this.props.actualizadoEn;
  }

  get respondidoEn(): Date | null {
    return this.props.respondidoEn;
  }

  /* =========================================================
   * REGLAS
   * ======================================================= */

  private assertPendiente(): void {
    if (!this.estaPendiente()) {
      throw new Error(
        `La conformidad no puede modificarse porque su estado actual es ${this.props.resultado}.`,
      );
    }
  }

  private static assertPersistenceState(
    props: TicketConformidadEntityProps,
  ): void {
    if (
      props.resultado === TicketConformidadResultado.PENDIENTE &&
      props.respondidoEn !== null
    ) {
      throw new Error('Una conformidad PENDIENTE no puede tener respondidoEn.');
    }

    if (
      props.resultado !== TicketConformidadResultado.PENDIENTE &&
      props.respondidoEn === null
    ) {
      throw new Error('Una conformidad respondida debe tener respondidoEn.');
    }
  }

  private static assertPositiveId(value: number | null, field: string): void {
    if (!Number.isInteger(value) || value === null || value <= 0) {
      throw new Error(`${field} debe ser un entero positivo.`);
    }
  }

  private static assertOptionalPositiveId(
    value: number | null | undefined,
    field: string,
  ): void {
    if (value === null || value === undefined) {
      return;
    }

    this.assertPositiveId(value, field);
  }

  private static assertValidDate(value: Date, field: string): void {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new Error(`${field} debe ser una fecha válida.`);
    }
  }
}
