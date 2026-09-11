import {
  EstadoAccesoInternet,
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from '../enums/ppoe-acceso-internet.enum';
import {
  AdoptarClienteAccesoInternetProps,
  ClienteAccesoInternetProps,
  CrearClienteAccesoInternetProps,
} from '../props/props-entity';

export class ClienteAccesoInternetEntity {
  private constructor(private readonly props: ClienteAccesoInternetProps) {}

  /**
   * Crea un acceso nuevo.
   *
   * Todo acceso recién registrado comienza en PENDIENTE.
   */
  static create(
    input: CrearClienteAccesoInternetProps,
  ): ClienteAccesoInternetEntity {
    this.assertPositiveId(input.clienteId, 'clienteId');

    this.assertOptionalPositiveId(
      input.servicioInternetId,
      'servicioInternetId',
    );

    const now = new Date();

    return new ClienteAccesoInternetEntity({
      id: null,

      empresaId: input.empresaId,

      clienteId: input.clienteId,
      servicioInternetId: input.servicioInternetId ?? null,

      tecnologia: input.tecnologia,
      metodoAutenticacion: input.metodoAutenticacion,
      estado: EstadoAccesoInternet.PENDIENTE,

      activadoEn: null,
      suspendidoEn: null,
      dadoDeBajaEn: null,

      creadoEn: now,
      actualizadoEn: now,
    });
  }

  /**
   * Registra en el CRM un acceso que ya existe
   * previamente en infraestructura.
   *
   * No simula:
   *
   * PENDIENTE -> ACTIVO
   *
   * ni:
   *
   * PENDIENTE -> ACTIVO -> SUSPENDIDO
   *
   * porque esas transiciones nunca ocurrieron
   * dentro del CRM.
   */
  static adoptarExistente(
    input: AdoptarClienteAccesoInternetProps,
  ): ClienteAccesoInternetEntity {
    this.assertPositiveId(input.empresaId, 'empresaId');

    this.assertPositiveId(input.clienteId, 'clienteId');

    this.assertPositiveId(input.servicioInternetId, 'servicioInternetId');

    if (
      input.estadoRemoto !== EstadoAccesoInternet.ACTIVO &&
      input.estadoRemoto !== EstadoAccesoInternet.SUSPENDIDO
    ) {
      throw new Error(
        'Un acceso adoptado debe encontrarse ACTIVO o SUSPENDIDO.',
      );
    }

    const fechaAdopcion = input.fechaAdopcion
      ? new Date(input.fechaAdopcion)
      : new Date();

    this.assertValidDate(fechaAdopcion, 'fechaAdopcion');

    return new ClienteAccesoInternetEntity({
      id: null,

      empresaId: input.empresaId,

      clienteId: input.clienteId,

      servicioInternetId: input.servicioInternetId,

      tecnologia: input.tecnologia,

      metodoAutenticacion: input.metodoAutenticacion,

      /**
       * Reflejamos directamente el estado
       * observado en MikroTik.
       */
      estado: input.estadoRemoto,

      /**
       * No conocemos las fechas históricas.
       *
       * Si posteriormente el CRM reactiva o
       * suspende este acceso, esas acciones sí
       * establecerán sus fechas correspondientes.
       */
      activadoEn: null,
      suspendidoEn: null,
      dadoDeBajaEn: null,

      /**
       * Sí conocemos cuándo se creó la
       * representación local.
       */
      creadoEn: fechaAdopcion,

      actualizadoEn: fechaAdopcion,
    });
  }

  /**
   * Reconstruye una entidad que ya existe en la base de datos.
   *
   *
   */
  static hydrate(
    props: ClienteAccesoInternetProps,
  ): ClienteAccesoInternetEntity {
    this.assertPositiveId(props.id, 'id');
    this.assertPositiveId(props.clienteId, 'clienteId');

    if (props.servicioInternetId !== null) {
      this.assertPositiveId(props.servicioInternetId, 'servicioInternetId');
    }

    return new ClienteAccesoInternetEntity({
      ...props,
      creadoEn: new Date(props.creadoEn),
      actualizadoEn: new Date(props.actualizadoEn),
      activadoEn: props.activadoEn ? new Date(props.activadoEn) : null,
      suspendidoEn: props.suspendidoEn ? new Date(props.suspendidoEn) : null,
      dadoDeBajaEn: props.dadoDeBajaEn ? new Date(props.dadoDeBajaEn) : null,
    });
  }

  /*
   * Identidad
   */

  get id(): number | null {
    return this.props.id;
  }

  get isPersisted(): boolean {
    return this.props.id !== null;
  }

  get clienteId(): number {
    return this.props.clienteId;
  }

  /*
   * Servicio y acceso
   */

  get servicioInternetId(): number | null {
    return this.props.servicioInternetId;
  }

  get tecnologia(): TecnologiaAccesoInternet {
    return this.props.tecnologia;
  }

  get metodoAutenticacion(): MetodoAutenticacionInternet {
    return this.props.metodoAutenticacion;
  }

  get estado(): EstadoAccesoInternet {
    return this.props.estado;
  }

  get empresaId(): number {
    return this.props.empresaId;
  }

  /*
   * Fechas de estado
   */

  get activadoEn(): Date | null {
    return this.props.activadoEn;
  }

  get suspendidoEn(): Date | null {
    return this.props.suspendidoEn;
  }

  get dadoDeBajaEn(): Date | null {
    return this.props.dadoDeBajaEn;
  }

  /*
   * Auditoría
   */

  get creadoEn(): Date {
    return this.props.creadoEn;
  }

  get actualizadoEn(): Date {
    return this.props.actualizadoEn;
  }

  /*
   * Comportamiento del acceso
   */

  /**
   * Indica que el acceso está siendo configurado físicamente
   * o preparado en la infraestructura.
   */
  iniciarConfiguracion(fecha: Date = new Date()): void {
    this.assertNotBaja();

    if (this.props.estado === EstadoAccesoInternet.CONFIGURANDO) {
      return;
    }

    if (this.props.estado !== EstadoAccesoInternet.PENDIENTE) {
      throw new Error(
        `No puede iniciarse la configuración de un acceso en estado ${this.props.estado}.`,
      );
    }

    this.props.estado = EstadoAccesoInternet.CONFIGURANDO;

    this.touch(fecha);
  }

  /**
   * Marca el acceso como activo.
   *
   * activadoEn conserva la primera fecha de activación.
   * Al reactivar un acceso suspendido no se pierde esa fecha.
   */
  activar(fecha: Date = new Date()): void {
    this.assertNotBaja();

    if (this.props.estado === EstadoAccesoInternet.ACTIVO) {
      return;
    }

    const estadosPermitidos: EstadoAccesoInternet[] = [
      EstadoAccesoInternet.PENDIENTE,
      EstadoAccesoInternet.CONFIGURANDO,
      EstadoAccesoInternet.SUSPENDIDO,
    ];

    if (!estadosPermitidos.includes(this.props.estado)) {
      throw new Error(
        `No puede activarse un acceso en estado ${this.props.estado}.`,
      );
    }

    this.props.estado = EstadoAccesoInternet.ACTIVO;

    this.props.activadoEn ??= new Date(fecha);

    this.props.suspendidoEn = null;

    this.touch(fecha);
  }

  /**
   * Suspende temporalmente un acceso activo.
   */
  suspender(fecha: Date = new Date()): void {
    if (this.props.estado === EstadoAccesoInternet.SUSPENDIDO) {
      return;
    }

    if (this.props.estado !== EstadoAccesoInternet.ACTIVO) {
      throw new Error(
        `Solamente puede suspenderse un acceso ACTIVO. Estado actual: ${this.props.estado}.`,
      );
    }

    this.props.estado = EstadoAccesoInternet.SUSPENDIDO;

    this.props.suspendidoEn = new Date(fecha);

    this.touch(fecha);
  }

  /**
   * Da de baja definitivamente el acceso.
   */
  darDeBaja(fecha: Date = new Date()): void {
    if (this.props.estado === EstadoAccesoInternet.BAJA) {
      return;
    }

    this.props.estado = EstadoAccesoInternet.BAJA;

    this.props.dadoDeBajaEn = new Date(fecha);

    this.touch(fecha);
  }

  /**
   * Cambia el servicio o plan asociado al acceso.
   *
   * Se utilizará posteriormente en migraciones de plan.
   */
  actualizarServicio(
    servicioInternetId: number | null,
    fecha: Date = new Date(),
  ): void {
    this.assertNotBaja();

    if (servicioInternetId !== null) {
      ClienteAccesoInternetEntity.assertPositiveId(
        servicioInternetId,
        'servicioInternetId',
      );
    }

    this.props.servicioInternetId = servicioInternetId;

    this.touch(fecha);
  }

  /**
   * Actualiza la tecnología del acceso.
   *
   * Se utilizará en migraciones como INALAMBRICO -> FIBRA_GPON.
   */
  actualizarTecnologia(
    tecnologia: TecnologiaAccesoInternet,
    fecha: Date = new Date(),
  ): void {
    this.assertNotBaja();

    this.props.tecnologia = tecnologia;

    this.touch(fecha);
  }

  /**
   * Actualiza el mecanismo de autenticación.
   *
   * Por ejemplo:
   * DHCP -> PPPOE
   * IP_ESTATICA -> PPPOE
   */
  actualizarMetodoAutenticacion(
    metodoAutenticacion: MetodoAutenticacionInternet,
    fecha: Date = new Date(),
  ): void {
    this.assertNotBaja();

    this.props.metodoAutenticacion = metodoAutenticacion;

    this.touch(fecha);
  }

  /*
   * Salida para persistencia
   */

  toPrimitives(): ClienteAccesoInternetProps {
    return {
      id: this.props.id,

      empresaId: this.props.empresaId,

      clienteId: this.props.clienteId,

      servicioInternetId: this.props.servicioInternetId,

      tecnologia: this.props.tecnologia,
      metodoAutenticacion: this.props.metodoAutenticacion,
      estado: this.props.estado,

      activadoEn: this.props.activadoEn,
      suspendidoEn: this.props.suspendidoEn,
      dadoDeBajaEn: this.props.dadoDeBajaEn,

      creadoEn: this.props.creadoEn,
      actualizadoEn: this.props.actualizadoEn,
    };
  }

  /*
   * Reglas internas
   */

  private assertNotBaja(): void {
    if (this.props.estado === EstadoAccesoInternet.BAJA) {
      throw new Error(
        'No se puede modificar un acceso que se encuentra dado de baja',
      );
    }
  }

  private touch(fecha: Date): void {
    this.props.actualizadoEn = fecha;
  }

  private static assertPositiveId(value: number | null, field: string): void {
    if (value === null || !Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} debe ser un identificador entero positivo`);
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
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`${field} debe ser una fecha válida.`);
    }
  }
}
