import {
  EstadoAccesoInternet,
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from '../enums/ppoe-acceso-internet.enum';

/**
 * Estado completo de ClienteAccesoInternet.
 */
export type ClienteAccesoInternetProps = {
  id: number | null;

  empresaId: number;
  clienteId: number;

  servicioInternetId: number | null;

  tecnologia: TecnologiaAccesoInternet;

  metodoAutenticacion: MetodoAutenticacionInternet;

  estado: EstadoAccesoInternet;

  activadoEn: Date | null;
  suspendidoEn: Date | null;
  dadoDeBajaEn: Date | null;

  creadoEn: Date;
  actualizadoEn: Date;
};

/**
 * Datos permitidos al crear un acceso nuevo.
 *
 * Todo acceso normal comienza PENDIENTE.
 */
export type CrearClienteAccesoInternetProps = {
  clienteId: number;

  empresaId: number;

  servicioInternetId?: number | null;

  tecnologia: TecnologiaAccesoInternet;

  metodoAutenticacion: MetodoAutenticacionInternet;
};

/**
 * Datos necesarios para registrar localmente
 * un acceso que ya existe y está operativo
 * previamente en infraestructura.
 *
 * Este flujo se utiliza durante la adopción
 * de cuentas PPPoE históricas.
 */
export type AdoptarClienteAccesoInternetProps = {
  empresaId: number;

  clienteId: number;

  servicioInternetId: number;

  tecnologia: TecnologiaAccesoInternet;

  metodoAutenticacion: MetodoAutenticacionInternet;

  /**
   * Estado observado directamente en MikroTik.
   *
   * Para una adopción solamente admitimos:
   *
   * ACTIVO
   * SUSPENDIDO
   */
  estadoRemoto: EstadoAccesoInternet.ACTIVO | EstadoAccesoInternet.SUSPENDIDO;

  /**
   * Momento en que el acceso fue incorporado
   * al CRM.
   *
   * No representa su fecha histórica
   * real de activación.
   */
  fechaAdopcion?: Date;
};
