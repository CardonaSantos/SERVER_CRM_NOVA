import { Money } from 'src/shared/domain/value-objects/money.vo';
import {
  ClienteDesinstalacionProps,
  CrearClienteDesinstalacionProps,
} from './props-entities.props';
import { EstadoDesinstalacionCliente } from '../enums/estado-desinstalacion-cliente.enum';
import { TipoDesinstalacionCliente } from '../enums/tipo-desinstalacion-cliente.enum';

export class ClienteDesinstalacionEntity {
  private constructor(private readonly props: ClienteDesinstalacionProps) {}

  static create(
    props: CrearClienteDesinstalacionProps,
  ): ClienteDesinstalacionEntity {
    const entity = new ClienteDesinstalacionEntity({
      empresaId: props.empresaId,
      clienteId: props.clienteId,

      servicioInternetId: props.servicioInternetId ?? null,
      ticketId: props.ticketId ?? null,

      solicitadoPorId: props.solicitadoPorId ?? null,
      ejecutadoPorId: props.ejecutadoPorId ?? null,
      creadoPorId: props.creadoPorId ?? null,

      tipo: props.tipo ?? TipoDesinstalacionCliente.COMPLETA,
      motivo: props.motivo ?? null,

      estado: EstadoDesinstalacionCliente.PROGRAMADA,

      fechaSolicitud: props.fechaSolicitud ?? new Date(),
      fechaProgramada: props.fechaProgramada ?? null,
      fechaInicio: null,
      fechaFinalizacion: null,
      fechaCancelacion: null,

      requiereRetiroEquipo: props.requiereRetiroEquipo ?? true,
      equipoRecuperado: false,

      saldoClienteAlMomento: props.saldoClienteAlMomento ?? Money.zero(),
      costoDesinstalacion: Money.zero(),
      costoTransporte: Money.zero(),
      costoManoObra: Money.zero(),
      costoOtros: Money.zero(),

      direccionServicio: props.direccionServicio ?? null,
      referenciaUbicacion: props.referenciaUbicacion ?? null,
      latitud: props.latitud ?? null,
      longitud: props.longitud ?? null,

      firmadoPor: null,
      dpiFirmante: null,
      conforme: null,

      observaciones: props.observaciones ?? null,
      resultado: null,
      metadata: props.metadata ?? undefined,

      creadoEn: undefined,
      actualizadoEn: undefined,
    });

    entity.ensureValidBaseProps();

    return entity;
  }

  static hydrate(
    props: ClienteDesinstalacionProps,
  ): ClienteDesinstalacionEntity {
    const entity = new ClienteDesinstalacionEntity(props);

    entity.ensureValidBaseProps();

    return entity;
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get empresaId(): number {
    return this.props.empresaId;
  }

  get clienteId(): number {
    return this.props.clienteId;
  }

  get servicioInternetId(): number | null | undefined {
    return this.props.servicioInternetId;
  }

  get estado(): EstadoDesinstalacionCliente {
    return this.props.estado;
  }

  get tipo(): TipoDesinstalacionCliente {
    return this.props.tipo;
  }

  get isPersisted(): boolean {
    return typeof this.props.id === 'number';
  }

  get isProgramada(): boolean {
    return this.props.estado === EstadoDesinstalacionCliente.PROGRAMADA;
  }

  get isEnProceso(): boolean {
    return this.props.estado === EstadoDesinstalacionCliente.EN_PROCESO;
  }

  get isCompletada(): boolean {
    return this.props.estado === EstadoDesinstalacionCliente.COMPLETADA;
  }

  get isCancelada(): boolean {
    return this.props.estado === EstadoDesinstalacionCliente.CANCELADA;
  }

  get isFinalizada(): boolean {
    return (
      this.props.estado === EstadoDesinstalacionCliente.COMPLETADA ||
      this.props.estado === EstadoDesinstalacionCliente.CANCELADA ||
      this.props.estado === EstadoDesinstalacionCliente.FALLIDA
    );
  }

  toPrimitives(): ClienteDesinstalacionProps {
    return {
      ...this.props,
    };
  }

  private ensureValidBaseProps(): void {
    this.ensurePositiveId(this.props.empresaId, 'empresaId');
    this.ensurePositiveId(this.props.clienteId, 'clienteId');

    if (this.props.id !== undefined) {
      this.ensurePositiveId(this.props.id, 'id');
    }

    if (this.props.servicioInternetId != null) {
      this.ensurePositiveId(
        this.props.servicioInternetId,
        'servicioInternetId',
      );
    }

    if (this.props.ticketId != null) {
      this.ensurePositiveId(this.props.ticketId, 'ticketId');
    }

    if (this.props.solicitadoPorId != null) {
      this.ensurePositiveId(this.props.solicitadoPorId, 'solicitadoPorId');
    }

    if (this.props.ejecutadoPorId != null) {
      this.ensurePositiveId(this.props.ejecutadoPorId, 'ejecutadoPorId');
    }

    if (this.props.creadoPorId != null) {
      this.ensurePositiveId(this.props.creadoPorId, 'creadoPorId');
    }

    this.ensureLocationPair();
    this.ensureNonNegativeMoney();
  }

  private ensurePositiveId(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un entero positivo.`);
    }
  }

  private ensureLocationPair(): void {
    const hasLat =
      this.props.latitud !== null && this.props.latitud !== undefined;

    const hasLng =
      this.props.longitud !== null && this.props.longitud !== undefined;

    if (hasLat && !hasLng) {
      throw new Error(
        'Si se proporciona latitud, también debe proporcionarse longitud.',
      );
    }

    if (!hasLat && hasLng) {
      throw new Error(
        'Si se proporciona longitud, también debe proporcionarse latitud.',
      );
    }
  }

  private ensureNonNegativeMoney(): void {
    const moneyFields = [
      ['saldoClienteAlMomento', this.props.saldoClienteAlMomento],
      ['costoDesinstalacion', this.props.costoDesinstalacion],
      ['costoTransporte', this.props.costoTransporte],
      ['costoManoObra', this.props.costoManoObra],
      ['costoOtros', this.props.costoOtros],
    ] as const;

    for (const [field, value] of moneyFields) {
      if (value.isNegative()) {
        throw new Error(`${field} no puede ser negativo.`);
      }
    }
  }

  private normalizeOptionalText(value?: string | null): string | null {
    if (value === undefined || value === null) return null;

    const normalized = value.trim();

    return normalized.length > 0 ? normalized : null;
  }

  private normalizeRequiredText(value: string, field: string): string {
    const normalized = value?.trim();

    if (!normalized) {
      throw new Error(`${field} es obligatorio.`);
    }

    return normalized;
  }
}
