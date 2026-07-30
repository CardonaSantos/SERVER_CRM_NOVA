import { Money } from 'src/shared/domain/value-objects/money.vo';

import { EstadoDesinstalacionCliente } from '../enums/estado-desinstalacion-cliente.enum';

import { TipoDesinstalacionCliente } from '../enums/tipo-desinstalacion-cliente.enum';

import {
  ActualizarCostosDesinstalacionParams,
  ActualizarDatosGeneralesDesinstalacionParams,
  CancelarClienteDesinstalacionParams,
  ClienteDesinstalacionProps,
  CompletarClienteDesinstalacionParams,
  CrearClienteDesinstalacionProps,
  IniciarClienteDesinstalacionParams,
  MarcarFallidaClienteDesinstalacionParams,
  RegistrarFirmaClienteDesinstalacionParams,
  ReprogramarClienteDesinstalacionParams,
} from './props-entities.props';

/**
 * Agregado raíz del flujo de desinstalación de un cliente.
 *
 * Esta entidad controla únicamente el estado operativo
 * local de la desinstalación.
 *
 * No ejecuta:
 *
 * - comandos SSH;
 * - eliminación de secrets;
 * - carga de evidencias;
 * - auditorías PPPoE.
 *
 * Esos efectos pertenecen a los casos de uso y puertos
 * de aplicación correspondientes.
 */
export class ClienteDesinstalacionEntity {
  private constructor(private readonly props: ClienteDesinstalacionProps) {}

  /**
   * ==========================================================
   * CONSTRUCCIÓN
   * ==========================================================
   */

  static create(
    input: CrearClienteDesinstalacionProps,
  ): ClienteDesinstalacionEntity {
    const entity = new ClienteDesinstalacionEntity({
      empresaId: input.empresaId,

      clienteId: input.clienteId,

      servicioInternetId: input.servicioInternetId ?? null,

      ticketId: input.ticketId ?? null,

      accesoInternetId: input.accesoInternetId ?? null,

      solicitadoPorId: input.solicitadoPorId ?? null,

      ejecutadoPorId: input.ejecutadoPorId ?? null,

      creadoPorId: input.creadoPorId ?? null,

      tipo: input.tipo ?? TipoDesinstalacionCliente.COMPLETA,

      motivo: input.motivo ?? null,

      estado: EstadoDesinstalacionCliente.PROGRAMADA,

      fechaSolicitud: input.fechaSolicitud ?? new Date(),

      fechaProgramada: input.fechaProgramada ?? null,

      fechaInicio: null,

      fechaFinalizacion: null,

      fechaCancelacion: null,

      requiereRetiroEquipo: input.requiereRetiroEquipo ?? true,

      equipoRecuperado: false,

      saldoClienteAlMomento: input.saldoClienteAlMomento ?? Money.zero(),

      costoDesinstalacion: Money.zero(),

      costoTransporte: Money.zero(),

      costoManoObra: Money.zero(),

      costoOtros: Money.zero(),

      direccionServicio: this.normalizeOptionalText(input.direccionServicio),

      referenciaUbicacion: this.normalizeOptionalText(
        input.referenciaUbicacion,
      ),

      latitud: input.latitud ?? null,

      longitud: input.longitud ?? null,

      firmadoPor: null,

      dpiFirmante: null,

      conforme: null,

      observaciones: this.normalizeOptionalText(input.observaciones),

      resultado: null,

      metadata: input.metadata,

      creadoEn: undefined,

      actualizadoEn: undefined,
    });

    entity.ensureValid();

    return entity;
  }

  /**
   * Reconstruye una desinstalación previamente persistida.
   */
  static hydrate(
    input: ClienteDesinstalacionProps,
  ): ClienteDesinstalacionEntity {
    const entity = new ClienteDesinstalacionEntity({
      ...input,

      direccionServicio: this.normalizeOptionalText(input.direccionServicio),

      referenciaUbicacion: this.normalizeOptionalText(
        input.referenciaUbicacion,
      ),

      firmadoPor: this.normalizeOptionalText(input.firmadoPor),

      dpiFirmante: this.normalizeOptionalText(input.dpiFirmante),

      observaciones: this.normalizeOptionalText(input.observaciones),

      resultado: this.normalizeOptionalText(input.resultado),

      fechaSolicitud: this.cloneOptionalDate(input.fechaSolicitud),

      fechaProgramada: this.cloneOptionalDate(input.fechaProgramada),

      fechaInicio: this.cloneOptionalDate(input.fechaInicio),

      fechaFinalizacion: this.cloneOptionalDate(input.fechaFinalizacion),

      fechaCancelacion: this.cloneOptionalDate(input.fechaCancelacion),

      creadoEn: input.creadoEn ? new Date(input.creadoEn) : undefined,

      actualizadoEn: input.actualizadoEn
        ? new Date(input.actualizadoEn)
        : undefined,
    });

    entity.ensureValid();

    return entity;
  }

  /**
   * ==========================================================
   * GETTERS
   * ==========================================================
   */

  get id(): number | undefined {
    return this.props.id;
  }

  get empresaId(): number {
    return this.props.empresaId;
  }

  get clienteId(): number {
    return this.props.clienteId;
  }

  get servicioInternetId(): number | null {
    return this.props.servicioInternetId ?? null;
  }

  get ticketId(): number | null {
    return this.props.ticketId ?? null;
  }

  get accesoInternetId(): number | null {
    return this.props.accesoInternetId ?? null;
  }

  get solicitadoPorId(): number | null {
    return this.props.solicitadoPorId ?? null;
  }

  get ejecutadoPorId(): number | null {
    return this.props.ejecutadoPorId ?? null;
  }

  get creadoPorId(): number | null {
    return this.props.creadoPorId ?? null;
  }

  get estado(): EstadoDesinstalacionCliente {
    return this.props.estado;
  }

  get tipo(): TipoDesinstalacionCliente {
    return this.props.tipo;
  }

  get requiereRetiroEquipo(): boolean {
    return this.props.requiereRetiroEquipo;
  }

  get equipoRecuperado(): boolean {
    return this.props.equipoRecuperado;
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

  get isFallida(): boolean {
    return this.props.estado === EstadoDesinstalacionCliente.FALLIDA;
  }

  get isFinalizada(): boolean {
    return [
      EstadoDesinstalacionCliente.COMPLETADA,
      EstadoDesinstalacionCliente.CANCELADA,
      EstadoDesinstalacionCliente.FALLIDA,
    ].includes(this.props.estado);
  }

  /**
   * ==========================================================
   * TRANSICIONES
   * ==========================================================
   */

  /**
   * PROGRAMADA -> EN_PROCESO
   */
  iniciar(params: IniciarClienteDesinstalacionParams = {}): void {
    this.ensurePersisted('iniciar');

    if (!this.isProgramada) {
      throw new Error(
        `Solo una desinstalación PROGRAMADA puede iniciarse. Estado actual: ${this.props.estado}.`,
      );
    }

    if (params.ejecutadoPorId != null) {
      this.ensurePositiveId(params.ejecutadoPorId, 'ejecutadoPorId');

      this.props.ejecutadoPorId = params.ejecutadoPorId;
    }

    const fechaInicio = params.fechaInicio ?? new Date();

    this.ensureValidDate(fechaInicio, 'fechaInicio');

    this.ensureDateNotBeforeRequest(fechaInicio, 'fechaInicio');

    this.props.estado = EstadoDesinstalacionCliente.EN_PROCESO;

    this.props.fechaInicio = new Date(fechaInicio);

    this.props.fechaFinalizacion = null;

    this.props.fechaCancelacion = null;

    this.ensureValid();
  }

  /**
   * EN_PROCESO -> COMPLETADA
   *
   * Este método finaliza el trabajo físico.
   * No ejecuta nuevamente la eliminación PPPoE.
   */
  completar(params: CompletarClienteDesinstalacionParams): void {
    this.ensurePersisted('completar');

    if (!this.isEnProceso) {
      throw new Error(
        `Solo una desinstalación EN_PROCESO puede completarse. Estado actual: ${this.props.estado}.`,
      );
    }

    this.ensurePositiveId(params.ejecutadoPorId, 'ejecutadoPorId');

    const fechaFinalizacion = params.fechaFinalizacion ?? new Date();

    this.ensureValidDate(fechaFinalizacion, 'fechaFinalizacion');

    this.ensureDateNotBeforeStart(fechaFinalizacion, 'fechaFinalizacion');

    this.props.estado = EstadoDesinstalacionCliente.COMPLETADA;

    this.props.ejecutadoPorId = params.ejecutadoPorId;

    this.props.fechaFinalizacion = new Date(fechaFinalizacion);

    this.props.fechaCancelacion = null;

    if (params.resultado !== undefined) {
      this.props.resultado = ClienteDesinstalacionEntity.normalizeOptionalText(
        params.resultado,
      );
    }

    if (params.observaciones !== undefined) {
      this.props.observaciones =
        ClienteDesinstalacionEntity.normalizeOptionalText(params.observaciones);
    }

    this.props.equipoRecuperado =
      params.equipoRecuperado ?? this.props.equipoRecuperado;

    if (params.conforme !== undefined) {
      this.props.conforme = params.conforme;
    }
    this.ensureValid();
  }

  /**
   * EN_PROCESO -> FALLIDA
   */
  marcarFallida(params: MarcarFallidaClienteDesinstalacionParams = {}): void {
    this.ensurePersisted('marcar como fallida');

    if (!this.isEnProceso) {
      throw new Error(
        `Solo una desinstalación EN_PROCESO puede marcarse como FALLIDA. Estado actual: ${this.props.estado}.`,
      );
    }

    const fechaFinalizacion = params.fechaFinalizacion ?? new Date();

    this.ensureValidDate(fechaFinalizacion, 'fechaFinalizacion');

    this.ensureDateNotBeforeStart(fechaFinalizacion, 'fechaFinalizacion');

    this.props.estado = EstadoDesinstalacionCliente.FALLIDA;

    this.props.fechaFinalizacion = new Date(fechaFinalizacion);

    this.props.fechaCancelacion = null;

    if (params.motivo !== undefined) {
      this.props.motivo = params.motivo ?? null;
    }

    if (params.resultado !== undefined) {
      this.props.resultado = ClienteDesinstalacionEntity.normalizeOptionalText(
        params.resultado,
      );
    }

    if (params.observaciones !== undefined) {
      this.props.observaciones =
        ClienteDesinstalacionEntity.normalizeOptionalText(params.observaciones);
    }

    this.ensureValid();
  }

  /**
   * PROGRAMADA | EN_PROCESO -> CANCELADA
   */
  cancelar(params: CancelarClienteDesinstalacionParams = {}): void {
    this.ensurePersisted('cancelar');

    if (!this.isProgramada && !this.isEnProceso) {
      throw new Error(
        `Solo una desinstalación PROGRAMADA o EN_PROCESO puede cancelarse. Estado actual: ${this.props.estado}.`,
      );
    }

    const fechaCancelacion = params.fechaCancelacion ?? new Date();

    this.ensureValidDate(fechaCancelacion, 'fechaCancelacion');

    this.ensureDateNotBeforeRequest(fechaCancelacion, 'fechaCancelacion');

    if (params.motivo !== undefined) {
      this.props.motivo = params.motivo ?? null;
    }

    if (params.observaciones !== undefined) {
      this.props.observaciones =
        ClienteDesinstalacionEntity.normalizeOptionalText(params.observaciones);
    }

    this.props.estado = EstadoDesinstalacionCliente.CANCELADA;

    this.props.fechaCancelacion = new Date(fechaCancelacion);

    this.props.fechaFinalizacion = null;

    this.ensureValid();
  }

  /**
   * Reprograma únicamente una desinstalación PROGRAMADA.
   */
  reprogramar(params: ReprogramarClienteDesinstalacionParams): void {
    this.ensurePersisted('reprogramar');

    if (!this.isProgramada) {
      throw new Error(
        `Solo una desinstalación PROGRAMADA puede reprogramarse. Estado actual: ${this.props.estado}.`,
      );
    }

    this.ensureValidDate(params.fechaProgramada, 'fechaProgramada');

    this.props.fechaProgramada = new Date(params.fechaProgramada);

    if (params.motivo !== undefined) {
      this.props.motivo = params.motivo ?? null;
    }

    if (params.observaciones !== undefined) {
      this.props.observaciones =
        ClienteDesinstalacionEntity.normalizeOptionalText(params.observaciones);
    }

    this.ensureValid();
  }

  /**
   * La autorización administrativa pertenece a otro
   * agregado.
   *
   * Aprobarla no cambia el estado PROGRAMADA; solamente
   * confirma que el registro continúa habilitado para
   * iniciar el flujo posteriormente.
   */
  autorizar(): void {
    this.ensurePersisted('autorizar');

    if (!this.isProgramada) {
      throw new Error(
        `Solo una desinstalación PROGRAMADA puede autorizarse. Estado actual: ${this.props.estado}.`,
      );
    }

    this.ensureValid();
  }

  /**
   * El rechazo de la autorización cancela la
   * desinstalación programada.
   */
  rechazarAutorizacion(): void {
    this.ensurePersisted('rechazar la autorización');

    if (!this.isProgramada) {
      throw new Error(
        `Solo una desinstalación PROGRAMADA puede cancelarse por rechazo de autorización. Estado actual: ${this.props.estado}.`,
      );
    }

    this.props.estado = EstadoDesinstalacionCliente.CANCELADA;

    this.props.fechaCancelacion = new Date();

    this.props.fechaFinalizacion = null;

    this.ensureValid();
  }

  /**
   * Registra la firma o conformidad del retiro.
   *
   * Puede registrarse durante la ejecución o después
   * de completar el trabajo físico.
   */
  registrarFirma(params: RegistrarFirmaClienteDesinstalacionParams): void {
    this.ensurePersisted('registrar la firma');

    if (!this.isEnProceso && !this.isCompletada) {
      throw new Error(
        `La firma solo puede registrarse en una desinstalación EN_PROCESO o COMPLETADA. Estado actual: ${this.props.estado}.`,
      );
    }

    const firmadoPor = params.firmadoPor?.trim();

    if (!firmadoPor) {
      throw new Error('firmadoPor es obligatorio.');
    }

    this.props.firmadoPor = firmadoPor;

    this.props.dpiFirmante = ClienteDesinstalacionEntity.normalizeOptionalText(
      params.dpiFirmante,
    );

    this.props.conforme = params.conforme;

    this.ensureValid();
  }

  /**
   * ==========================================================
   * ACTUALIZACIONES SIN TRANSICIÓN
   * ==========================================================
   */

  actualizarDatosGenerales(
    params: ActualizarDatosGeneralesDesinstalacionParams,
  ): void {
    this.ensurePersisted('actualizar datos generales');

    this.ensureEditable();

    const intentaModificarRelacionTecnica =
      params.accesoInternetId !== undefined ||
      params.servicioInternetId !== undefined;

    if (intentaModificarRelacionTecnica && !this.isProgramada) {
      throw new Error(
        'El acceso y el servicio de internet solo pueden modificarse mientras la desinstalación está PROGRAMADA.',
      );
    }

    if (params.servicioInternetId !== undefined) {
      this.props.servicioInternetId = params.servicioInternetId;
    }

    if (params.ticketId !== undefined) {
      this.props.ticketId = params.ticketId;
    }

    if (params.accesoInternetId !== undefined) {
      this.props.accesoInternetId = params.accesoInternetId;
    }

    if (params.solicitadoPorId !== undefined) {
      this.props.solicitadoPorId = params.solicitadoPorId;
    }

    if (params.ejecutadoPorId !== undefined) {
      this.props.ejecutadoPorId = params.ejecutadoPorId;
    }

    if (params.tipo !== undefined) {
      this.props.tipo = params.tipo;
    }

    if (params.motivo !== undefined) {
      this.props.motivo = params.motivo;
    }

    if (params.fechaProgramada !== undefined) {
      if (params.fechaProgramada !== null) {
        this.ensureValidDate(params.fechaProgramada, 'fechaProgramada');
      }

      this.props.fechaProgramada = params.fechaProgramada
        ? new Date(params.fechaProgramada)
        : null;
    }

    if (params.requiereRetiroEquipo !== undefined) {
      this.props.requiereRetiroEquipo = params.requiereRetiroEquipo;
    }

    if (params.direccionServicio !== undefined) {
      this.props.direccionServicio =
        ClienteDesinstalacionEntity.normalizeOptionalText(
          params.direccionServicio,
        );
    }

    if (params.referenciaUbicacion !== undefined) {
      this.props.referenciaUbicacion =
        ClienteDesinstalacionEntity.normalizeOptionalText(
          params.referenciaUbicacion,
        );
    }

    if (params.latitud !== undefined) {
      this.props.latitud = params.latitud;
    }

    if (params.longitud !== undefined) {
      this.props.longitud = params.longitud;
    }

    if (params.observaciones !== undefined) {
      this.props.observaciones =
        ClienteDesinstalacionEntity.normalizeOptionalText(params.observaciones);
    }

    if (params.metadata !== undefined) {
      this.props.metadata = params.metadata;
    }

    this.ensureValid();
  }

  actualizarCostos(params: ActualizarCostosDesinstalacionParams): void {
    this.ensurePersisted('actualizar costos');

    this.ensureEditable();

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

    this.ensureValid();
  }

  /**
   * ==========================================================
   * CONVERSIÓN
   * ==========================================================
   */

  toPrimitives(): ClienteDesinstalacionProps {
    return {
      ...this.props,

      fechaSolicitud: ClienteDesinstalacionEntity.cloneOptionalDate(
        this.props.fechaSolicitud,
      ),

      fechaProgramada: ClienteDesinstalacionEntity.cloneOptionalDate(
        this.props.fechaProgramada,
      ),

      fechaInicio: ClienteDesinstalacionEntity.cloneOptionalDate(
        this.props.fechaInicio,
      ),

      fechaFinalizacion: ClienteDesinstalacionEntity.cloneOptionalDate(
        this.props.fechaFinalizacion,
      ),

      fechaCancelacion: ClienteDesinstalacionEntity.cloneOptionalDate(
        this.props.fechaCancelacion,
      ),

      creadoEn: this.props.creadoEn ? new Date(this.props.creadoEn) : undefined,

      actualizadoEn: this.props.actualizadoEn
        ? new Date(this.props.actualizadoEn)
        : undefined,
    };
  }

  /**
   * ==========================================================
   * VALIDACIONES
   * ==========================================================
   */

  private ensureValid(): void {
    this.ensurePositiveId(this.props.empresaId, 'empresaId');

    this.ensurePositiveId(this.props.clienteId, 'clienteId');

    if (this.props.id !== undefined) {
      this.ensurePositiveId(this.props.id, 'id');
    }

    this.ensureOptionalPositiveId(
      this.props.servicioInternetId,
      'servicioInternetId',
    );

    this.ensureOptionalPositiveId(this.props.ticketId, 'ticketId');

    this.ensureOptionalPositiveId(
      this.props.accesoInternetId,
      'accesoInternetId',
    );

    this.ensureOptionalPositiveId(
      this.props.solicitadoPorId,
      'solicitadoPorId',
    );

    this.ensureOptionalPositiveId(this.props.ejecutadoPorId, 'ejecutadoPorId');

    this.ensureOptionalPositiveId(this.props.creadoPorId, 'creadoPorId');

    this.ensureValidOptionalDate(this.props.fechaSolicitud, 'fechaSolicitud');

    this.ensureValidOptionalDate(this.props.fechaProgramada, 'fechaProgramada');

    this.ensureValidOptionalDate(this.props.fechaInicio, 'fechaInicio');

    this.ensureValidOptionalDate(
      this.props.fechaFinalizacion,
      'fechaFinalizacion',
    );

    this.ensureValidOptionalDate(
      this.props.fechaCancelacion,
      'fechaCancelacion',
    );

    this.ensureLocationPair();

    this.ensureCoordinateRanges();

    this.ensureNonNegativeMoney();

    this.ensureStateConsistency();

    this.ensureTemporalConsistency();
  }

  private ensureStateConsistency(): void {
    switch (this.props.estado) {
      case EstadoDesinstalacionCliente.PROGRAMADA: {
        if (
          this.props.fechaInicio ||
          this.props.fechaFinalizacion ||
          this.props.fechaCancelacion
        ) {
          throw new Error(
            'Una desinstalación PROGRAMADA no puede contener fechas de inicio, finalización o cancelación.',
          );
        }

        return;
      }

      case EstadoDesinstalacionCliente.EN_PROCESO: {
        if (!this.props.fechaInicio) {
          throw new Error(
            'Una desinstalación EN_PROCESO debe contener fechaInicio.',
          );
        }

        if (this.props.fechaFinalizacion || this.props.fechaCancelacion) {
          throw new Error(
            'Una desinstalación EN_PROCESO no puede contener fechaFinalizacion ni fechaCancelacion.',
          );
        }

        return;
      }

      case EstadoDesinstalacionCliente.COMPLETADA: {
        if (!this.props.fechaInicio || !this.props.fechaFinalizacion) {
          throw new Error(
            'Una desinstalación COMPLETADA debe contener fechaInicio y fechaFinalizacion.',
          );
        }

        if (this.props.fechaCancelacion) {
          throw new Error(
            'Una desinstalación COMPLETADA no puede contener fechaCancelacion.',
          );
        }

        return;
      }

      case EstadoDesinstalacionCliente.CANCELADA: {
        if (!this.props.fechaCancelacion) {
          throw new Error(
            'Una desinstalación CANCELADA debe contener fechaCancelacion.',
          );
        }

        if (this.props.fechaFinalizacion) {
          throw new Error(
            'Una desinstalación CANCELADA no puede contener fechaFinalizacion.',
          );
        }

        return;
      }

      case EstadoDesinstalacionCliente.FALLIDA: {
        if (!this.props.fechaInicio || !this.props.fechaFinalizacion) {
          throw new Error(
            'Una desinstalación FALLIDA debe contener fechaInicio y fechaFinalizacion.',
          );
        }

        if (this.props.fechaCancelacion) {
          throw new Error(
            'Una desinstalación FALLIDA no puede contener fechaCancelacion.',
          );
        }

        return;
      }

      default: {
        const exhaustiveCheck: never = this.props.estado;

        throw new Error(
          `Estado de desinstalación no soportado: ${String(exhaustiveCheck)}.`,
        );
      }
    }
  }

  private ensureTemporalConsistency(): void {
    const fechaSolicitud = this.props.fechaSolicitud;

    if (
      fechaSolicitud &&
      this.props.fechaInicio &&
      this.props.fechaInicio.getTime() < fechaSolicitud.getTime()
    ) {
      throw new Error('fechaInicio no puede ser anterior a fechaSolicitud.');
    }

    if (
      this.props.fechaInicio &&
      this.props.fechaFinalizacion &&
      this.props.fechaFinalizacion.getTime() < this.props.fechaInicio.getTime()
    ) {
      throw new Error('fechaFinalizacion no puede ser anterior a fechaInicio.');
    }

    if (
      fechaSolicitud &&
      this.props.fechaCancelacion &&
      this.props.fechaCancelacion.getTime() < fechaSolicitud.getTime()
    ) {
      throw new Error(
        'fechaCancelacion no puede ser anterior a fechaSolicitud.',
      );
    }
  }

  private ensureLocationPair(): void {
    const hasLatitude =
      this.props.latitud !== null && this.props.latitud !== undefined;

    const hasLongitude =
      this.props.longitud !== null && this.props.longitud !== undefined;

    if (hasLatitude !== hasLongitude) {
      throw new Error('latitud y longitud deben proporcionarse juntas.');
    }
  }

  private ensureCoordinateRanges(): void {
    if (
      this.props.latitud !== null &&
      this.props.latitud !== undefined &&
      (!Number.isFinite(this.props.latitud) ||
        this.props.latitud < -90 ||
        this.props.latitud > 90)
    ) {
      throw new Error('latitud debe estar entre -90 y 90.');
    }

    if (
      this.props.longitud !== null &&
      this.props.longitud !== undefined &&
      (!Number.isFinite(this.props.longitud) ||
        this.props.longitud < -180 ||
        this.props.longitud > 180)
    ) {
      throw new Error('longitud debe estar entre -180 y 180.');
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

  private ensureEditable(): void {
    if (this.isFinalizada) {
      throw new Error(
        'No se puede editar una desinstalación completada, cancelada o fallida.',
      );
    }
  }

  private ensurePersisted(action: string): void {
    if (!this.isPersisted) {
      throw new Error(
        `No se puede ${action} una desinstalación que aún no ha sido guardada.`,
      );
    }
  }

  private ensureDateNotBeforeRequest(value: Date, field: string): void {
    const fechaSolicitud = this.props.fechaSolicitud;

    if (fechaSolicitud && value.getTime() < fechaSolicitud.getTime()) {
      throw new Error(`${field} no puede ser anterior a fechaSolicitud.`);
    }
  }

  private ensureDateNotBeforeStart(value: Date, field: string): void {
    const fechaInicio = this.props.fechaInicio;

    if (!fechaInicio) {
      throw new Error('La desinstalación no contiene fechaInicio.');
    }

    if (value.getTime() < fechaInicio.getTime()) {
      throw new Error(`${field} no puede ser anterior a fechaInicio.`);
    }
  }

  private ensurePositiveId(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un entero positivo.`);
    }
  }

  private ensureOptionalPositiveId(
    value: number | null | undefined,
    field: string,
  ): void {
    if (value === null || value === undefined) {
      return;
    }

    this.ensurePositiveId(value, field);
  }

  private ensureValidDate(value: Date, field: string): void {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new Error(`${field} debe ser una fecha válida.`);
    }
  }

  private ensureValidOptionalDate(
    value: Date | null | undefined,
    field: string,
  ): void {
    if (value === null || value === undefined) {
      return;
    }

    this.ensureValidDate(value, field);
  }

  private static normalizeOptionalText(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = value.trim();

    return normalized || null;
  }

  private static cloneOptionalDate(value?: Date | null): Date | null {
    return value ? new Date(value) : null;
  }
}
