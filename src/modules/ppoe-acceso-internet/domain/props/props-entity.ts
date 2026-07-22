import {
  EstadoAccesoInternet,
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from '../enums/ppoe-acceso-internet.enum';

/**
 * Estado completo de ClienteAccesoInternet.
 *
 * Se utiliza principalmente para:
 * - Rehidratar la entidad desde persistencia.
 * - Exponer sus valores primitivos al mapper.
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
 * No recibe:
 * - id: lo genera la base de datos.
 * - estado: siempre comienza como PENDIENTE.
 * - fechas de activación, suspensión o baja.
 * - fechas de auditoría.
 */
export type CrearClienteAccesoInternetProps = {
  clienteId: number;

  empresaId: number;

  servicioInternetId?: number | null;

  tecnologia: TecnologiaAccesoInternet;
  metodoAutenticacion: MetodoAutenticacionInternet;
};
