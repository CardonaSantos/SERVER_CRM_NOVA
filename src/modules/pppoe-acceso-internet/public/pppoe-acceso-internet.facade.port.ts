import { CrearClienteAccesoInternetProps } from '../domain/props/cliente-acceso-internet.props';
import { AccesoInternetReadModel } from '../domain/read-models/acceso-internet.read-model';

export const PPPOE_ACCESO_INTERNET = Symbol('PPPOE_ACCESO_INTERNET');

export type CrearAccesoInternetInput = CrearClienteAccesoInternetProps;

export type TransicionAccesoInternet =
  | 'INICIAR_CONFIGURACION'
  | 'ACTIVAR'
  | 'SUSPENDER'
  | 'DAR_DE_BAJA';

export type CambiarEstadoAccesoInternetInput = {
  accesoInternetId: number;
  transicion: TransicionAccesoInternet;
  /** Momento confirmado de la transición; sin él se usa la hora del reloj. */
  fecha?: Date;
};

/** Único camino para que otro módulo lea o cambie un ClienteAccesoInternet. */
export interface PppoeAccesoInternetFacadePort {
  buscarPorId(
    accesoInternetId: number,
  ): Promise<AccesoInternetReadModel | null>;

  /** El acceso solo si pertenece al cliente indicado. */
  buscarDelCliente(params: {
    accesoInternetId: number;
    clienteId: number;
  }): Promise<AccesoInternetReadModel | null>;

  /**
   * El acceso PPPoE vigente más reciente del cliente (PENDIENTE,
   * CONFIGURANDO, ACTIVO o SUSPENDIDO). Un acceso en BAJA es un ciclo
   * terminado y no impide una prealta nueva.
   */
  buscarPppoeVigenteDelCliente(
    clienteId: number,
  ): Promise<AccesoInternetReadModel | null>;

  /** Registra un acceso nuevo; siempre nace PENDIENTE. */
  crear(input: CrearAccesoInternetInput): Promise<AccesoInternetReadModel>;

  /**
   * Aplica la transición con las reglas de la entidad y la persiste.
   * Repetir la transición del estado actual no cambia nada.
   * @throws AccesoInternetNoEncontradoError si el acceso no existe.
   */
  cambiarEstado(
    input: CambiarEstadoAccesoInternetInput,
  ): Promise<AccesoInternetReadModel>;
}
