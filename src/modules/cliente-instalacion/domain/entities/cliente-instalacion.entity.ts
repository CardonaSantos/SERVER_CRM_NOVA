import { Money } from 'src/shared/domain/value-objects/money.vo';
import { TipoInstalacionCliente } from '../enums/tipo-instalacion-cliente.enum';
import {
  ActualizarCostosInstalacionParams,
  ActualizarDatosGeneralesInstalacionParams,
  CancelarClienteInstalacionParams,
  ClienteInstalacionProps,
  CompletarClienteInstalacionParams,
  CrearClienteInstalacionProps,
  IniciarClienteInstalacionParams,
  MarcarFallidaClienteInstalacionParams,
  ReprogramarClienteInstalacionParams,
} from './entities-props.props';
import { EstadoInstalacionCliente } from '../enums/estado-instalacion-cliente.enum';

export class ClienteInstalacionEntity {
  private constructor(private readonly props: ClienteInstalacionProps) {}

  private static toMoney(value?: number): Money {
    return value !== undefined ? Money.fromNumber(value) : Money.zero();
  }

  static create(props: CrearClienteInstalacionProps): ClienteInstalacionEntity {
    const entity = new ClienteInstalacionEntity({
      ...props,

      servicioInternetId: props.servicioInternetId ?? null,
      ticketId: props.ticketId ?? null,
      asesorId: props.asesorId ?? null,
      creadoPorId: props.creadoPorId ?? null,

      tipo: props.tipo ?? TipoInstalacionCliente.NUEVA,

      estado: props.estado ?? EstadoInstalacionCliente.PROGRAMADA,

      completadoPorId: null,

      fechaProgramada: props.fechaProgramada ?? null,
      fechaInicio: props.fechaInicio ?? null,

      fechaFinalizacion: null,
      fechaCancelacion: null,
      fechaActivacionServicio: null,

      motivo: props.motivo ?? null,
      observaciones: props.observaciones ?? null,
      resultado: null,

      direccionInstalacion: props.direccionInstalacion ?? null,

      referenciaUbicacion: props.referenciaUbicacion ?? null,

      latitud: props.latitud ?? null,
      longitud: props.longitud ?? null,

      descripcion: props.descripcion ?? null,

      costoInstalacion: this.toMoney(props.costos?.costoInstalacion),

      costoMateriales: this.toMoney(props.costos?.costoMateriales),

      costoManoObra: this.toMoney(props.costos?.costoManoObra),

      costoOtros: this.toMoney(props.costos?.costoOtros),

      montoCobradoCliente: this.toMoney(props.costos?.montoCobradoCliente),

      notasCostos: props.costos?.notas ?? null,

      creadoEn: undefined,
      actualizadoEn: undefined,
    });

    entity.ensureValidBaseProps();

    return entity;
  }

  static hydrate(props: ClienteInstalacionProps): ClienteInstalacionEntity {
    const entity = new ClienteInstalacionEntity(props);

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

  get ticketId(): number | null | undefined {
    return this.props.ticketId;
  }

  get estado(): EstadoInstalacionCliente {
    return this.props.estado;
  }

  get tipo(): TipoInstalacionCliente {
    return this.props.tipo;
  }

  get fechaProgramada(): Date | null | undefined {
    return this.props.fechaProgramada;
  }

  get isPersisted(): boolean {
    return typeof this.props.id === 'number';
  }

  get isProgramada(): boolean {
    return this.props.estado === EstadoInstalacionCliente.PROGRAMADA;
  }

  get isEnProceso(): boolean {
    return this.props.estado === EstadoInstalacionCliente.EN_PROCESO;
  }

  get isCompletada(): boolean {
    return this.props.estado === EstadoInstalacionCliente.COMPLETADA;
  }

  get isCancelada(): boolean {
    return this.props.estado === EstadoInstalacionCliente.CANCELADA;
  }

  get isFinalizada(): boolean {
    return (
      this.props.estado === EstadoInstalacionCliente.COMPLETADA ||
      this.props.estado === EstadoInstalacionCliente.CANCELADA ||
      this.props.estado === EstadoInstalacionCliente.FALLIDA
    );
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

  private normalizeOptionalText(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }

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

  private recalcularSaldoPendiente(): void {
    const total = this.props.costoInstalacion
      .add(this.props.costoMateriales)
      .add(this.props.costoManoObra)
      .add(this.props.costoOtros);

    if (this.props.montoCobradoCliente.isGreaterThan(total)) {
      throw new Error(
        'El monto cobrado al cliente no puede ser mayor al costo total de la instalación.',
      );
    }
  }

  //   METHODS

  reprogramar(params: ReprogramarClienteInstalacionParams): void {
    this.ensurePersisted('reprogramar');

    if (
      this.props.estado !== EstadoInstalacionCliente.PROGRAMADA &&
      this.props.estado !== EstadoInstalacionCliente.REPROGRAMADA
    ) {
      throw new Error(
        'Solo una instalación programada o reprogramada puede reprogramarse.',
      );
    }

    this.props.estado = EstadoInstalacionCliente.REPROGRAMADA;
    this.props.fechaProgramada = params.fechaProgramada;
    this.props.motivo = this.normalizeOptionalText(params.motivo);

    this.ensureValidBaseProps();
  }

  iniciar(params: IniciarClienteInstalacionParams = {}): void {
    this.ensurePersisted('iniciar');

    if (
      this.props.estado !== EstadoInstalacionCliente.PROGRAMADA &&
      this.props.estado !== EstadoInstalacionCliente.REPROGRAMADA
    ) {
      throw new Error(
        'Solo una instalación programada o reprogramada puede iniciarse.',
      );
    }

    this.props.estado = EstadoInstalacionCliente.EN_PROCESO;
    this.props.fechaInicio = params.fechaInicio ?? new Date();

    this.ensureValidBaseProps();
  }

  completar(params: CompletarClienteInstalacionParams): void {
    this.ensurePersisted('completar');

    if (this.props.estado !== EstadoInstalacionCliente.EN_PROCESO) {
      throw new Error('Solo una instalación en proceso puede completarse.');
    }

    this.ensurePositiveId(params.completadoPorId, 'completadoPorId');

    const fechaFinalizacion = params.fechaFinalizacion ?? new Date();

    if (Number.isNaN(fechaFinalizacion.getTime())) {
      throw new Error('fechaFinalizacion debe contener una fecha válida.');
    }

    this.props.estado = EstadoInstalacionCliente.COMPLETADA;

    this.props.completadoPorId = params.completadoPorId;

    this.props.fechaFinalizacion = new Date(fechaFinalizacion);

    this.props.resultado = this.normalizeOptionalText(params.resultado);

    this.props.observaciones =
      this.normalizeOptionalText(params.observaciones) ??
      this.props.observaciones;

    this.ensureValidBaseProps();
  }

  /**
   * Confirma que el servicio fue activado después
   * de una operación remota exitosa.
   *
   * La activación puede realizarse mientras la
   * instalación está EN_PROCESO o después de
   * haber quedado COMPLETADA.
   *
   * Este método no ejecuta SSH ni cambia el
   * estado general de la instalación.
   */
  marcarServicioActivado(fecha: Date = new Date()): void {
    this.ensurePersisted('marcar el servicio como activado');

    const estadosPermitidos: EstadoInstalacionCliente[] = [
      EstadoInstalacionCliente.EN_PROCESO,
      EstadoInstalacionCliente.COMPLETADA,
    ];

    if (!estadosPermitidos.includes(this.props.estado)) {
      throw new Error(
        'Solo una instalación en proceso o completada puede confirmar la activación del servicio.',
      );
    }

    /*
     * La primera activación confirmada se conserva.
     * Una repetición de la misma solicitud es
     * idempotente.
     */
    if (this.props.fechaActivacionServicio) {
      return;
    }

    const fechaActivacion = new Date(fecha);

    if (Number.isNaN(fechaActivacion.getTime())) {
      throw new Error('La fecha de activación del servicio no es válida.');
    }

    /*
     * La activación no debería registrarse antes
     * del inicio físico de la instalación.
     */
    if (
      this.props.fechaInicio &&
      fechaActivacion.getTime() < this.props.fechaInicio.getTime()
    ) {
      throw new Error(
        'La activación del servicio no puede ser anterior al inicio de la instalación.',
      );
    }

    this.props.fechaActivacionServicio = fechaActivacion;

    this.ensureValidBaseProps();
  }

  cancelar(params: CancelarClienteInstalacionParams): void {
    this.ensurePersisted('cancelar');

    if (this.props.estado === EstadoInstalacionCliente.COMPLETADA) {
      throw new Error('No se puede cancelar una instalación completada.');
    }

    if (this.props.estado === EstadoInstalacionCliente.CANCELADA) {
      throw new Error('La instalación ya está cancelada.');
    }

    const motivo = this.normalizeRequiredText(params.motivo, 'motivo');

    this.props.estado = EstadoInstalacionCliente.CANCELADA;
    this.props.motivo = motivo;
    this.props.observaciones =
      this.normalizeOptionalText(params.observaciones) ??
      this.props.observaciones;
    this.props.fechaCancelacion = params.fechaCancelacion ?? new Date();

    this.ensureValidBaseProps();
  }

  marcarFallida(params: MarcarFallidaClienteInstalacionParams): void {
    this.ensurePersisted('marcar como fallida');

    if (this.props.estado !== EstadoInstalacionCliente.EN_PROCESO) {
      throw new Error(
        'Solo una instalación en proceso puede marcarse como fallida.',
      );
    }

    const motivo = this.normalizeRequiredText(params.motivo, 'motivo');

    this.props.estado = EstadoInstalacionCliente.FALLIDA;
    this.props.motivo = motivo;
    this.props.resultado = this.normalizeOptionalText(params.resultado);
    this.props.observaciones =
      this.normalizeOptionalText(params.observaciones) ??
      this.props.observaciones;
    this.props.fechaFinalizacion = params.fechaFinalizacion ?? new Date();

    this.ensureValidBaseProps();
  }

  actualizarDatosGenerales(
    params: ActualizarDatosGeneralesInstalacionParams,
  ): void {
    this.ensurePersisted('actualizar datos generales');
    this.ensureEditable();

    if (params.tipo !== undefined) {
      this.ensurePlanningEditable('cambiar el tipo de instalación');

      this.props.tipo = params.tipo;
    }

    if (params.asesorId !== undefined) {
      this.props.asesorId = params.asesorId;
    }

    if (params.ticketId !== undefined) {
      this.props.ticketId = params.ticketId;
    }

    if (params.descripcion !== undefined) {
      this.props.descripcion = this.normalizeOptionalText(params.descripcion);
    }

    if (params.motivo !== undefined) {
      this.props.motivo = this.normalizeOptionalText(params.motivo);
    }

    if (params.observaciones !== undefined) {
      this.props.observaciones = this.normalizeOptionalText(
        params.observaciones,
      );
    }

    if (params.fechaProgramada !== undefined) {
      this.ensurePlanningEditable('cambiar la fecha programada');

      if (
        params.fechaProgramada !== null &&
        Number.isNaN(params.fechaProgramada.getTime())
      ) {
        throw new Error('fechaProgramada debe contener una fecha válida.');
      }

      this.props.fechaProgramada =
        params.fechaProgramada !== null
          ? new Date(params.fechaProgramada)
          : null;
    }

    if (params.direccionInstalacion !== undefined) {
      this.props.direccionInstalacion = this.normalizeOptionalText(
        params.direccionInstalacion,
      );
    }

    if (params.referenciaUbicacion !== undefined) {
      this.props.referenciaUbicacion = this.normalizeOptionalText(
        params.referenciaUbicacion,
      );
    }

    if (params.latitud !== undefined) {
      this.props.latitud = params.latitud;
    }

    if (params.longitud !== undefined) {
      this.props.longitud = params.longitud;
    }

    this.ensureValidBaseProps();
  }

  actualizarCostos(params: ActualizarCostosInstalacionParams): void {
    this.ensurePersisted('actualizar costos');

    this.ensureEditable();

    if (params.costoInstalacion !== undefined) {
      this.props.costoInstalacion = params.costoInstalacion;
    }

    if (params.costoMateriales !== undefined) {
      this.props.costoMateriales = params.costoMateriales;
    }

    if (params.costoManoObra !== undefined) {
      this.props.costoManoObra = params.costoManoObra;
    }

    if (params.costoOtros !== undefined) {
      this.props.costoOtros = params.costoOtros;
    }

    if (params.montoCobradoCliente !== undefined) {
      this.props.montoCobradoCliente = params.montoCobradoCliente;
    }

    if (params.notasCostos !== undefined) {
      this.props.notasCostos = this.normalizeOptionalText(params.notasCostos);
    }

    this.recalcularSaldoPendiente();
    this.ensureValidBaseProps();
  }

  limpiarConfiguracionWifi(): void {
    this.ensurePersisted('limpiar configuración WiFi');

    this.ensureValidBaseProps();
  }

  toPrimitives(): ClienteInstalacionProps {
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

    if (this.props.asesorId != null) {
      this.ensurePositiveId(this.props.asesorId, 'asesorId');
    }

    if (this.props.creadoPorId != null) {
      this.ensurePositiveId(this.props.creadoPorId, 'creadoPorId');
    }

    if (this.props.completadoPorId != null) {
      this.ensurePositiveId(this.props.completadoPorId, 'completadoPorId');
    }

    this.ensureLocationPair();
    this.ensureNonNegativeMoney();
  }

  private ensurePlanningEditable(action: string): void {
    const estadosPermitidos: EstadoInstalacionCliente[] = [
      EstadoInstalacionCliente.PROGRAMADA,
      EstadoInstalacionCliente.REPROGRAMADA,
    ];

    if (!estadosPermitidos.includes(this.props.estado)) {
      throw new Error(
        `No se puede ${action} cuando la instalación se encuentra en estado ${this.props.estado}.`,
      );
    }
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
      ['costoInstalacion', this.props.costoInstalacion],
      ['costoMateriales', this.props.costoMateriales],
      ['costoManoObra', this.props.costoManoObra],
      ['costoOtros', this.props.costoOtros],
      ['montoCobradoCliente', this.props.montoCobradoCliente],
    ] as const;

    for (const [field, value] of moneyFields) {
      if (value.isNegative()) {
        throw new Error(`${field} no puede ser negativo.`);
      }
    }
  }
}
