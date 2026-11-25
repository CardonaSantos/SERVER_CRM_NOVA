import {
  EstadoAccesoInternet,
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from '../enums/cliente-acceso-internet.enum';
import {
  AccesoInternetDadoDeBajaError,
  AccesoInternetDatosInvalidosError,
  AccesoInternetEstadoInvalidoError,
} from '../errors/pppoe-acceso-internet.errors';
import {
  AdoptarClienteAccesoInternetProps,
  ClienteAccesoInternetProps,
  CrearClienteAccesoInternetProps,
} from '../props/cliente-acceso-internet.props';

export class ClienteAccesoInternetEntity {
  private constructor(private readonly props: ClienteAccesoInternetProps) {}

  /** Acceso nuevo: siempre nace PENDIENTE. */
  static create(
    input: CrearClienteAccesoInternetProps,
    ahora: Date,
  ): ClienteAccesoInternetEntity {
    assertIdPositivo(input.empresaId, 'empresaId');
    assertIdPositivo(input.clienteId, 'clienteId');
    if (input.servicioInternetId != null) {
      assertIdPositivo(input.servicioInternetId, 'servicioInternetId');
    }
    assertFecha(ahora, 'ahora');

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
      creadoEn: new Date(ahora),
      actualizadoEn: new Date(ahora),
    });
  }

  /**
   * Registra un acceso que ya opera en el router (adopción de cuentas
   * históricas). Refleja el estado observado sin simular transiciones que
   * nunca pasaron por el CRM, y deja las fechas de estado en null porque las
   * históricas no se conocen.
   */
  static adoptarExistente(
    input: AdoptarClienteAccesoInternetProps,
  ): ClienteAccesoInternetEntity {
    assertIdPositivo(input.empresaId, 'empresaId');
    assertIdPositivo(input.clienteId, 'clienteId');
    assertIdPositivo(input.servicioInternetId, 'servicioInternetId');
    assertFecha(input.fechaAdopcion, 'fechaAdopcion');

    if (
      input.estadoRemoto !== EstadoAccesoInternet.ACTIVO &&
      input.estadoRemoto !== EstadoAccesoInternet.SUSPENDIDO
    ) {
      throw new AccesoInternetEstadoInvalidoError(
        'Un acceso adoptado debe estar ACTIVO o SUSPENDIDO.',
      );
    }

    return new ClienteAccesoInternetEntity({
      id: null,
      empresaId: input.empresaId,
      clienteId: input.clienteId,
      servicioInternetId: input.servicioInternetId,
      tecnologia: input.tecnologia,
      metodoAutenticacion: input.metodoAutenticacion,
      estado: input.estadoRemoto,
      activadoEn: null,
      suspendidoEn: null,
      dadoDeBajaEn: null,
      creadoEn: new Date(input.fechaAdopcion),
      actualizadoEn: new Date(input.fechaAdopcion),
    });
  }

  static hydrate(
    props: ClienteAccesoInternetProps,
  ): ClienteAccesoInternetEntity {
    assertIdPositivo(props.id, 'id');
    assertIdPositivo(props.clienteId, 'clienteId');
    if (props.servicioInternetId !== null) {
      assertIdPositivo(props.servicioInternetId, 'servicioInternetId');
    }

    return new ClienteAccesoInternetEntity(copiar(props));
  }

  get id(): number | null {
    return this.props.id;
  }

  get empresaId(): number {
    return this.props.empresaId;
  }

  get clienteId(): number {
    return this.props.clienteId;
  }

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

  get activadoEn(): Date | null {
    return copiarFecha(this.props.activadoEn);
  }

  get suspendidoEn(): Date | null {
    return copiarFecha(this.props.suspendidoEn);
  }

  get dadoDeBajaEn(): Date | null {
    return copiarFecha(this.props.dadoDeBajaEn);
  }

  get creadoEn(): Date {
    return new Date(this.props.creadoEn);
  }

  get actualizadoEn(): Date {
    return new Date(this.props.actualizadoEn);
  }

  /** El secret ya se está creando en el router: PENDIENTE → CONFIGURANDO. */
  iniciarConfiguracion(fecha: Date): void {
    this.assertNoDadoDeBaja();
    if (this.props.estado === EstadoAccesoInternet.CONFIGURANDO) return;

    if (this.props.estado !== EstadoAccesoInternet.PENDIENTE) {
      throw new AccesoInternetEstadoInvalidoError(
        `No puede iniciarse la configuración de un acceso en estado ${this.props.estado}.`,
      );
    }

    this.props.estado = EstadoAccesoInternet.CONFIGURANDO;
    this.tocar(fecha);
  }

  /** `activadoEn` conserva la primera activación; reactivar no la pisa. */
  activar(fecha: Date): void {
    this.assertNoDadoDeBaja();
    if (this.props.estado === EstadoAccesoInternet.ACTIVO) return;

    this.props.estado = EstadoAccesoInternet.ACTIVO;
    this.props.activadoEn ??= new Date(fecha);
    this.props.suspendidoEn = null;
    this.tocar(fecha);
  }

  suspender(fecha: Date): void {
    if (this.props.estado === EstadoAccesoInternet.SUSPENDIDO) return;

    if (this.props.estado !== EstadoAccesoInternet.ACTIVO) {
      throw new AccesoInternetEstadoInvalidoError(
        `Solo puede suspenderse un acceso ACTIVO. Estado actual: ${this.props.estado}.`,
      );
    }

    this.props.estado = EstadoAccesoInternet.SUSPENDIDO;
    this.props.suspendidoEn = new Date(fecha);
    this.tocar(fecha);
  }

  /** Baja definitiva; se acepta desde cualquier estado. */
  darDeBaja(fecha: Date): void {
    if (this.props.estado === EstadoAccesoInternet.BAJA) return;

    this.props.estado = EstadoAccesoInternet.BAJA;
    this.props.dadoDeBajaEn = new Date(fecha);
    this.tocar(fecha);
  }

  toPrimitives(): ClienteAccesoInternetProps {
    return copiar(this.props);
  }

  private assertNoDadoDeBaja(): void {
    if (this.props.estado === EstadoAccesoInternet.BAJA) {
      throw new AccesoInternetDadoDeBajaError();
    }
  }

  private tocar(fecha: Date): void {
    assertFecha(fecha, 'fecha');
    this.props.actualizadoEn = new Date(fecha);
  }
}

function copiarFecha(fecha: Date | null): Date | null {
  return fecha ? new Date(fecha) : null;
}

function copiar(props: ClienteAccesoInternetProps): ClienteAccesoInternetProps {
  return {
    ...props,
    activadoEn: copiarFecha(props.activadoEn),
    suspendidoEn: copiarFecha(props.suspendidoEn),
    dadoDeBajaEn: copiarFecha(props.dadoDeBajaEn),
    creadoEn: new Date(props.creadoEn),
    actualizadoEn: new Date(props.actualizadoEn),
  };
}

function assertIdPositivo(valor: number | null, campo: string): void {
  if (valor === null || !Number.isInteger(valor) || valor <= 0) {
    throw new AccesoInternetDatosInvalidosError(
      `${campo} debe ser un identificador entero positivo.`,
    );
  }
}

function assertFecha(valor: Date, campo: string): void {
  if (!(valor instanceof Date) || Number.isNaN(valor.getTime())) {
    throw new AccesoInternetDatosInvalidosError(
      `${campo} debe ser una fecha válida.`,
    );
  }
}
