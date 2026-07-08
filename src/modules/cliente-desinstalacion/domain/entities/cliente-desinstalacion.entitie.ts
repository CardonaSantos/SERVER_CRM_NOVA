import { Money } from 'src/shared/domain/value-objects/money.vo';
import {
  ActualizarCostosDesinstalacionParams,
  ActualizarDatosGeneralesDesinstalacionParams,
  CancelarClienteDesinstalacionParams,
  ClienteDesinstalacionProps,
  CompletarClienteDesinstalacionParams,
  CrearClienteDesinstalacionProps,
  IniciarClienteDesinstalacionParams,
  ReprogramarClienteDesinstalacionParams,
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

  iniciar(params: IniciarClienteDesinstalacionParams = {}): void {
    this.ensurePersisted('iniciar');

    if (this.props.estado !== EstadoDesinstalacionCliente.PROGRAMADA) {
      throw new Error('Solo una desinstalación programada puede iniciarse.');
    }

    if (params.ejecutadoPorId != null) {
      this.ensurePositiveId(params.ejecutadoPorId, 'ejecutadoPorId');
      this.props.ejecutadoPorId = params.ejecutadoPorId;
    }

    this.props.estado = EstadoDesinstalacionCliente.EN_PROCESO;
    this.props.fechaInicio = params.fechaInicio ?? new Date();

    this.ensureValidBaseProps();
  }

  cancelar(params: CancelarClienteDesinstalacionParams) {
    if (params.fechaCancelacion) {
      this.props.fechaCancelacion = params.fechaCancelacion;
    }

    if (params.motivo) {
      this.props.motivo = params.motivo;
    }

    if (params.observaciones) {
      this.props.observaciones = params.observaciones;
    }

    this.ensureValidBaseProps();
  }

  reprogramar(params: ReprogramarClienteDesinstalacionParams): void {
    this.ensurePersisted('reprogramar');

    if (
      this.props.estado !== EstadoDesinstalacionCliente.PROGRAMADA &&
      this.props.estado !== EstadoDesinstalacionCliente.COMPLETADA
    ) {
      throw new Error(
        'Solo una desinstalación programada o pendiente puede reprogramarse.',
      );
    }

    this.props.fechaProgramada = params.fechaProgramada;
    this.props.motivo = params.motivo ?? this.props.motivo;
    this.props.observaciones =
      this.normalizeOptionalText(params.observaciones) ??
      this.props.observaciones;

    this.ensureValidBaseProps();
  }

  completar(params: CompletarClienteDesinstalacionParams): void {
    this.ensurePersisted('completar');

    if (this.props.estado !== EstadoDesinstalacionCliente.EN_PROCESO) {
      throw new Error('Solo una desinstalación en proceso puede completarse.');
    }

    this.ensurePositiveId(params.ejecutadoPorId, 'ejecutadoPorId');

    this.props.estado = EstadoDesinstalacionCliente.COMPLETADA;
    this.props.ejecutadoPorId = params.ejecutadoPorId;
    this.props.fechaFinalizacion = params.fechaFinalizacion ?? new Date();
    this.props.resultado = this.normalizeOptionalText(params.resultado);
    this.props.observaciones =
      this.normalizeOptionalText(params.observaciones) ??
      this.props.observaciones;
    this.props.equipoRecuperado = params.equipoRecuperado ?? false;
    this.props.conforme = params.conforme ?? null;

    this.ensureValidBaseProps();
  }

  actualizarCostos(params: ActualizarCostosDesinstalacionParams): void {
    this.ensurePersisted('actualizar costos');

    if (params.saldoClienteAlMomento !== undefined) {
      this.props.saldoClienteAlMomento = params.saldoClienteAlMomento;
    }

    if (params.costoDesinstalacion !== undefined) {
      this.props.costoDesinstalacion = params.costoDesinstalacion;
    }

    if (params.costoTransporte !== undefined) {
      this.props.costoTransporte = params.costoTransporte;
    }

    if (params.costoManoObra !== undefined) {
      this.props.costoManoObra = params.costoManoObra;
    }

    if (params.costoOtros !== undefined) {
      this.props.costoOtros = params.costoOtros;
    }

    this.ensureValidBaseProps();
  }

  // AUTH
  autorizar(): void {
    this.ensurePersisted('autorizar');

    if (this.props.estado !== EstadoDesinstalacionCliente.PROGRAMADA) {
      throw new Error('La desinstalación no está pendiente de autorización.');
    }

    this.props.estado = EstadoDesinstalacionCliente.PROGRAMADA;

    this.ensureValidBaseProps();
  }

  rechazarAutorizacion(): void {
    this.ensurePersisted('rechazar autorización');

    if (this.props.estado !== EstadoDesinstalacionCliente.PROGRAMADA) {
      throw new Error(
        'La desinstalación no está en estado válido para rechazar.',
      );
    }

    this.props.estado = EstadoDesinstalacionCliente.CANCELADA;

    this.ensureValidBaseProps();
  }

  private ensurePersisted(action: string): void {
    if (!this.isPersisted) {
      throw new Error(
        `No se puede ${action} una instalación que aún no ha sido guardada.`,
      );
    }
  }

  private ensureEditable(): void {
    if (this.isFinalizada) {
      throw new Error(
        'No se puede editar una instalación completada, cancelada o fallida.',
      );
    }
  }
  actualizarDatosGenerales(
    params: ActualizarDatosGeneralesDesinstalacionParams,
  ): void {
    this.ensurePersisted('actualizar datos generales');
    this.ensureEditable();

    const {
      direccionServicio,
      ejecutadoPorId,
      fechaProgramada,
      latitud,
      longitud,
      // metadata,
      motivo,
      observaciones,
      referenciaUbicacion,
      requiereRetiroEquipo,
      servicioInternetId,
      solicitadoPorId,
      ticketId,
      tipo,
    } = params;

    if (servicioInternetId !== undefined) {
      this.props.servicioInternetId = servicioInternetId;
    }

    if (ticketId !== undefined) {
      this.props.ticketId = ticketId;
    }

    if (direccionServicio !== undefined) {
      this.props.direccionServicio = direccionServicio;
    }

    if (ejecutadoPorId !== undefined) {
      this.props.ejecutadoPorId = ejecutadoPorId;
    }

    if (motivo !== undefined) {
      this.props.motivo = motivo;
    }

    if (requiereRetiroEquipo !== undefined) {
      this.props.requiereRetiroEquipo = requiereRetiroEquipo;
    }

    if (solicitadoPorId !== undefined) {
      this.props.solicitadoPorId = solicitadoPorId;
    }

    if (tipo !== undefined) {
      this.props.tipo = tipo;
    }

    if (fechaProgramada !== undefined) {
      this.props.fechaProgramada = fechaProgramada;
    }

    if (referenciaUbicacion !== undefined) {
      this.props.referenciaUbicacion =
        this.normalizeOptionalText(referenciaUbicacion);
    }

    if (latitud !== undefined) {
      this.props.latitud = latitud;
    }

    if (longitud !== undefined) {
      this.props.longitud = longitud;
    }

    if (observaciones !== undefined) {
      this.props.observaciones = this.normalizeOptionalText(observaciones);
    }

    this.ensureValidBaseProps();
  }
}
