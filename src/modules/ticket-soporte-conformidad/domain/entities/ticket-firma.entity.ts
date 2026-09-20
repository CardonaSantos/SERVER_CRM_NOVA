import { TicketFirmaOrigen } from '../enums/ticket-firma-origen.enum';
import { TicketFirmaTipo } from '../enums/ticket-firma-tipo.enum';
import {
  CrearTicketFirmaClienteEntityProps,
  CrearTicketFirmaTecnicoEntityProps,
  TicketFirmaEntityProps,
} from './entities-props.props';

export class TicketFirmaEntity {
  private constructor(private readonly props: TicketFirmaEntityProps) {}

  /* =========================================================
   * FACTORIES
   * ======================================================= */

  static createCliente(
    input: CrearTicketFirmaClienteEntityProps,
  ): TicketFirmaEntity {
    this.assertPositiveId(input.conformidadId, 'conformidadId');
    this.assertPositiveId(input.mediaId, 'mediaId');

    const nombreFirmante = this.normalizeRequiredString(
      input.nombreFirmante,
      'nombreFirmante',
    );

    const telefonoFirmante = this.normalizeRequiredString(
      input.telefonoFirmante,
      'telefonoFirmante',
    );

    const ipOrigen = this.normalizeOptionalString(input.ipOrigen);
    const userAgent = this.normalizeOptionalString(input.userAgent);

    return new TicketFirmaEntity({
      id: null,

      conformidadId: input.conformidadId,
      mediaId: input.mediaId,

      tipo: TicketFirmaTipo.CLIENTE,

      usuarioFirmanteId: null,

      nombreFirmante,
      telefonoFirmante,

      origen: input.origen,

      ipOrigen,
      userAgent,

      firmadoEn: new Date(),
    });
  }

  static createTecnico(
    input: CrearTicketFirmaTecnicoEntityProps,
  ): TicketFirmaEntity {
    this.assertPositiveId(input.conformidadId, 'conformidadId');
    this.assertPositiveId(input.mediaId, 'mediaId');

    this.assertPositiveId(input.usuarioFirmanteId, 'usuarioFirmanteId');

    const nombreFirmante = this.normalizeRequiredString(
      input.nombreFirmante,
      'nombreFirmante',
    );

    const ipOrigen = this.normalizeOptionalString(input.ipOrigen);
    const userAgent = this.normalizeOptionalString(input.userAgent);

    return new TicketFirmaEntity({
      id: null,

      conformidadId: input.conformidadId,
      mediaId: input.mediaId,

      tipo: TicketFirmaTipo.TECNICO,

      usuarioFirmanteId: input.usuarioFirmanteId,

      nombreFirmante,
      telefonoFirmante: null,

      origen: TicketFirmaOrigen.CRM,

      ipOrigen,
      userAgent,

      firmadoEn: new Date(),
    });
  }

  /**
   * Utilizado exclusivamente por infraestructura para reconstruir
   * registros existentes.
   */
  static rehydrate(props: TicketFirmaEntityProps): TicketFirmaEntity {
    this.assertPositiveId(props.id, 'id');

    this.assertPositiveId(props.conformidadId, 'conformidadId');
    this.assertPositiveId(props.mediaId, 'mediaId');

    this.assertValidDate(props.firmadoEn, 'firmadoEn');

    const normalized: TicketFirmaEntityProps = {
      ...props,

      nombreFirmante: this.normalizeRequiredString(
        props.nombreFirmante,
        'nombreFirmante',
      ),

      telefonoFirmante: this.normalizeOptionalString(props.telefonoFirmante),

      ipOrigen: this.normalizeOptionalString(props.ipOrigen),
      userAgent: this.normalizeOptionalString(props.userAgent),
    };

    this.assertFirmaRules(normalized);

    return new TicketFirmaEntity(normalized);
  }

  /* =========================================================
   * CONSULTAS
   * ======================================================= */

  esFirmaCliente(): boolean {
    return this.props.tipo === TicketFirmaTipo.CLIENTE;
  }

  esFirmaTecnico(): boolean {
    return this.props.tipo === TicketFirmaTipo.TECNICO;
  }

  /* =========================================================
   * MAPPER
   * ======================================================= */

  toPrimitives(): TicketFirmaEntityProps {
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

  get conformidadId(): number {
    return this.props.conformidadId;
  }

  get mediaId(): number {
    return this.props.mediaId;
  }

  get tipo(): TicketFirmaTipo {
    return this.props.tipo;
  }

  get usuarioFirmanteId(): number | null {
    return this.props.usuarioFirmanteId;
  }

  get nombreFirmante(): string {
    return this.props.nombreFirmante;
  }

  get telefonoFirmante(): string | null {
    return this.props.telefonoFirmante;
  }

  get origen(): TicketFirmaOrigen {
    return this.props.origen;
  }

  get ipOrigen(): string | null {
    return this.props.ipOrigen;
  }

  get userAgent(): string | null {
    return this.props.userAgent;
  }

  get firmadoEn(): Date {
    return this.props.firmadoEn;
  }

  /* =========================================================
   * REGLAS
   * ======================================================= */

  private static assertFirmaRules(props: TicketFirmaEntityProps): void {
    if (props.tipo === TicketFirmaTipo.CLIENTE) {
      if (!props.telefonoFirmante) {
        throw new Error('La firma del cliente requiere telefonoFirmante.');
      }

      if (props.usuarioFirmanteId !== null) {
        throw new Error(
          'La firma del cliente no puede tener usuarioFirmanteId.',
        );
      }

      return;
    }

    if (props.tipo === TicketFirmaTipo.TECNICO) {
      this.assertPositiveId(props.usuarioFirmanteId, 'usuarioFirmanteId');

      if (props.origen !== TicketFirmaOrigen.CRM) {
        throw new Error(
          'La firma del técnico únicamente puede originarse desde el CRM.',
        );
      }
    }
  }

  private static assertPositiveId(value: number | null, field: string): void {
    if (!Number.isInteger(value) || value === null || value <= 0) {
      throw new Error(`${field} debe ser un entero positivo.`);
    }
  }

  private static normalizeRequiredString(value: string, field: string): string {
    const normalized = value?.trim();

    if (!normalized) {
      throw new Error(`${field} es obligatorio.`);
    }

    return normalized;
  }

  private static normalizeOptionalString(value?: string | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = value.trim();

    return normalized.length > 0 ? normalized : null;
  }

  private static assertValidDate(value: Date, field: string): void {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new Error(`${field} debe ser una fecha válida.`);
    }
  }
}
