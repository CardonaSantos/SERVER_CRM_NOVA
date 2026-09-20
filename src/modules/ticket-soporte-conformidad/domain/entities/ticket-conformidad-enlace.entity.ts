import { TicketConformidadCanal } from '../enums/ticket-conformidad-canal.enum';
import {
  CrearTicketConformidadEnlaceEntityProps,
  TicketConformidadEnlaceEntityProps,
} from './entities-props.props';

export class TicketConformidadEnlaceEntity {
  private constructor(
    private readonly props: TicketConformidadEnlaceEntityProps,
  ) {}

  /* =========================================================
   * FACTORIES
   * ======================================================= */

  static create(
    input: CrearTicketConformidadEnlaceEntityProps,
  ): TicketConformidadEnlaceEntity {
    this.assertPositiveId(input.conformidadId, 'conformidadId');

    this.assertOptionalPositiveId(input.creadoPorId, 'creadoPorId');

    const tokenHash = this.normalizeTokenHash(input.tokenHash);

    this.assertValidDate(input.expiraEn, 'expiraEn');

    const creadoEn = new Date();

    if (input.expiraEn.getTime() <= creadoEn.getTime()) {
      throw new Error('expiraEn debe ser posterior a la fecha de creación.');
    }

    const telefonoDestino = this.normalizeOptionalString(input.telefonoDestino);

    this.assertCanalRules(input.canal, telefonoDestino);

    return new TicketConformidadEnlaceEntity({
      id: null,

      conformidadId: input.conformidadId,

      tokenHash,

      canal: input.canal,

      telefonoDestino,

      expiraEn: input.expiraEn,

      usadoEn: null,
      revocadoEn: null,

      creadoPorId: input.creadoPorId ?? null,

      creadoEn,
    });
  }

  static rehydrate(
    props: TicketConformidadEnlaceEntityProps,
  ): TicketConformidadEnlaceEntity {
    this.assertPositiveId(props.id, 'id');

    this.assertPositiveId(props.conformidadId, 'conformidadId');

    this.assertOptionalPositiveId(props.creadoPorId, 'creadoPorId');

    this.assertValidDate(props.creadoEn, 'creadoEn');
    this.assertValidDate(props.expiraEn, 'expiraEn');

    if (props.usadoEn) {
      this.assertValidDate(props.usadoEn, 'usadoEn');
    }

    if (props.revocadoEn) {
      this.assertValidDate(props.revocadoEn, 'revocadoEn');
    }

    const normalized: TicketConformidadEnlaceEntityProps = {
      ...props,

      tokenHash: this.normalizeTokenHash(props.tokenHash),

      telefonoDestino: this.normalizeOptionalString(props.telefonoDestino),
    };

    this.assertCanalRules(normalized.canal, normalized.telefonoDestino);

    this.assertPersistenceState(normalized);

    return new TicketConformidadEnlaceEntity(normalized);
  }

  /* =========================================================
   * COMPORTAMIENTO
   * ======================================================= */

  marcarUsado(fecha: Date = new Date()): void {
    this.assertPuedeUtilizarse(fecha);

    this.props.usadoEn = fecha;
  }

  revocar(fecha: Date = new Date()): void {
    TicketConformidadEnlaceEntity.assertValidDate(fecha, 'fecha');

    if (this.estaUsado()) {
      throw new Error('No se puede revocar un enlace que ya fue utilizado.');
    }

    if (this.estaRevocado()) {
      throw new Error('El enlace ya se encuentra revocado.');
    }

    this.props.revocadoEn = fecha;
  }

  /* =========================================================
   * CONSULTAS DE DOMINIO
   * ======================================================= */

  estaExpirado(fecha: Date = new Date()): boolean {
    return fecha.getTime() >= this.props.expiraEn.getTime();
  }

  estaUsado(): boolean {
    return this.props.usadoEn !== null;
  }

  estaRevocado(): boolean {
    return this.props.revocadoEn !== null;
  }

  puedeUtilizarse(fecha: Date = new Date()): boolean {
    return (
      !this.estaExpirado(fecha) && !this.estaUsado() && !this.estaRevocado()
    );
  }

  /* =========================================================
   * MAPPER
   * ======================================================= */

  toPrimitives(): TicketConformidadEnlaceEntityProps {
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

  get tokenHash(): string {
    return this.props.tokenHash;
  }

  get canal(): TicketConformidadCanal {
    return this.props.canal;
  }

  get telefonoDestino(): string | null {
    return this.props.telefonoDestino;
  }

  get expiraEn(): Date {
    return this.props.expiraEn;
  }

  get usadoEn(): Date | null {
    return this.props.usadoEn;
  }

  get revocadoEn(): Date | null {
    return this.props.revocadoEn;
  }

  get creadoPorId(): number | null {
    return this.props.creadoPorId;
  }

  get creadoEn(): Date {
    return this.props.creadoEn;
  }

  /* =========================================================
   * REGLAS
   * ======================================================= */

  private assertPuedeUtilizarse(fecha: Date): void {
    TicketConformidadEnlaceEntity.assertValidDate(fecha, 'fecha');

    if (this.estaUsado()) {
      throw new Error('El enlace ya fue utilizado.');
    }

    if (this.estaRevocado()) {
      throw new Error('El enlace fue revocado.');
    }

    if (this.estaExpirado(fecha)) {
      throw new Error('El enlace ha expirado.');
    }
  }

  private static assertPersistenceState(
    props: TicketConformidadEnlaceEntityProps,
  ): void {
    if (props.usadoEn !== null && props.revocadoEn !== null) {
      throw new Error(
        'Un enlace no puede estar utilizado y revocado simultáneamente.',
      );
    }

    if (props.expiraEn.getTime() <= props.creadoEn.getTime()) {
      throw new Error('expiraEn debe ser posterior a creadoEn.');
    }
  }

  private static assertCanalRules(
    canal: TicketConformidadCanal,
    telefonoDestino: string | null,
  ): void {
    if (canal === TicketConformidadCanal.WHATSAPP && !telefonoDestino) {
      throw new Error(
        'Un enlace enviado por WhatsApp requiere telefonoDestino.',
      );
    }
  }

  private static normalizeTokenHash(value: string): string {
    const normalized = value?.trim().toLowerCase();

    if (!normalized) {
      throw new Error('tokenHash es obligatorio.');
    }

    /**
     * Nuestro contrato es SHA-256 hexadecimal:
     * 256 bits = 64 caracteres hexadecimales.
     */
    if (!/^[a-f0-9]{64}$/.test(normalized)) {
      throw new Error('tokenHash debe ser un hash SHA-256 hexadecimal válido.');
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
