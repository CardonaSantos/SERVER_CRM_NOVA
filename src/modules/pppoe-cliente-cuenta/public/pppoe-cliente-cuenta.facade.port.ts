import { EstadoCuentaPppoe } from '../domain/enums/estado-cuenta-pppoe.enum';
import { CrearClientePppoeCuentaProps } from '../domain/props/cliente-pppoe-cuenta.props';
import { ClientePppoeCuentaReadModel } from '../domain/read-models/cliente-pppoe-cuenta.read-model';
import { ClientePppoeCuentaDetalleResult } from '../domain/read-models/cliente-pppoe-cuenta-detalle.read-model';

export const PPPOE_CLIENTE_CUENTA = Symbol('PPPOE_CLIENTE_CUENTA');

export type CrearCuentaPppoeInput = CrearClientePppoeCuentaProps;

export type TransicionCuentaPppoe =
  | 'INICIAR_INSTALACION'
  | 'REINTENTAR_INSTALACION'
  | 'MARCAR_SECRET_CREADO'
  | 'INICIAR_ACTIVACION'
  | 'REINTENTAR_ACTIVACION'
  | 'MARCAR_ACTIVA'
  | 'MARCAR_SUSPENDIDA'
  | 'INICIAR_DESINSTALACION'
  | 'MARCAR_ELIMINADA';

export type CambiarEstadoCuentaPppoeInput = {
  cuentaPppoeId: number;
  transicion: TransicionCuentaPppoe;
  /** Momento confirmado del cambio; sin él se usa la hora del reloj. */
  fecha?: Date;
};

export type RegistrarErrorCuentaPppoeInput = {
  cuentaPppoeId: number;
  /** Mensaje ya saneado (sin secretos ni salida del router). */
  mensaje: string;
  fecha?: Date;
};

export type ObtenerDetalleCuentaPppoeInput = {
  cuentaPppoeId: number;
};

export type ConsultarCredencialesPppoeInstalacionInput = {
  instalacionId: number;
  operadorId: number;
  operadorNombre?: string | null;
  ipOrigen?: string | null;
  userAgent?: string | null;
};

export type CredencialPppoeInstalacionItem = {
  cuentaPppoeId: number;
  accesoInternetId: number;
  perfilHomologacionId: number;
  mikrotikRouterId: number;
  servicioInternetId: number;
  codigoPerfil: string;
  usuario: string;
  /** Descifrada para esta respuesta: no se persiste, ni se registra, ni se guarda en el front. */
  contrasena: string;
  estadoCuenta: EstadoCuentaPppoe;
  generadoEn: Date;
};

export type ConsultarCredencialesPppoeInstalacionResult = {
  instalacionId: number;
  credenciales: CredencialPppoeInstalacionItem[];
};

/** Único camino para que otro módulo lea o cambie una ClientePppoeCuenta. */
export interface PppoeClienteCuentaFacadePort {
  buscarPorId(
    cuentaPppoeId: number,
  ): Promise<ClientePppoeCuentaReadModel | null>;

  /** La cuenta (1 a 1) del acceso de internet. */
  buscarPorAccesoInternet(
    accesoInternetId: number,
  ): Promise<ClientePppoeCuentaReadModel | null>;

  /** Cuenta vigente con ese usuario PPPoE; ELIMINADA y CANCELADA no cuentan. */
  buscarVigentePorUsuario(
    usuario: string,
  ): Promise<ClientePppoeCuentaReadModel | null>;

  /** Cuenta nueva en PENDIENTE_ACTIVACION; el secreto llega ya cifrado. */
  crear(input: CrearCuentaPppoeInput): Promise<ClientePppoeCuentaReadModel>;

  /**
   * Aplica la transición con las reglas de la entidad y la persiste.
   * @throws CuentaPppoeNoEncontradaError si la cuenta no existe.
   */
  cambiarEstado(
    input: CambiarEstadoCuentaPppoeInput,
  ): Promise<ClientePppoeCuentaReadModel>;

  /** Deja la cuenta en ERROR con el mensaje. */
  registrarError(
    input: RegistrarErrorCuentaPppoeInput,
  ): Promise<ClientePppoeCuentaReadModel>;

  /**
   * Detalle administrativo con las acciones permitidas (activar, suspender…),
   * para no duplicar esas reglas en otros módulos.
   * @throws CuentaPppoeNoEncontradaError si la cuenta no existe.
   */
  obtenerDetalle(
    input: ObtenerDetalleCuentaPppoeInput,
  ): Promise<ClientePppoeCuentaDetalleResult>;

  /** Descifra las credenciales de la instalación y registra la consulta en la bitácora. */
  consultarCredencialesInstalacion(
    input: ConsultarCredencialesPppoeInstalacionInput,
  ): Promise<ConsultarCredencialesPppoeInstalacionResult>;
}
