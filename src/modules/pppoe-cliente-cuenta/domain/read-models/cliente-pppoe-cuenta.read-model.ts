import { SecretoPppoeProtegido } from 'src/modules/pppoe-credentials/public/pppoe-secret-cipher.port';

import { ClientePppoeCuentaEntity } from '../entities/cliente-pppoe-cuenta.entity';
import { EstadoCuentaPppoe } from '../enums/estado-cuenta-pppoe.enum';

/**
 * Foto de solo lectura de una cuenta PPPoE persistida, para otros módulos.
 * Trae el material cifrado (para descifrar en el momento) y nunca debe
 * llegar a una respuesta HTTP.
 */
export type ClientePppoeCuentaReadModel = {
  id: number;
  empresaId: number;
  accesoInternetId: number;
  perfilHomologacionId: number;
  usuario: string;
  secretoProtegido: SecretoPppoeProtegido;
  estado: EstadoCuentaPppoe;
  generadoPorId: number | null;
  adoptadoPorId: number | null;
  generadoEn: Date;
  secretCreadoEn: Date | null;
  activadoEn: Date | null;
  suspendidoEn: Date | null;
  eliminadoEn: Date | null;
  adoptadoEn: Date | null;
  ultimaSincronizacionEn: Date | null;
  ultimoError: string | null;
  actualizadoEn: Date;
  estaPendienteActivacion: boolean;
  estaActiva: boolean;
  estaSuspendida: boolean;
  estaEliminada: boolean;
  /** El secret existe en el router: confirmado por el CRM o adoptado. */
  tieneSecretCreado: boolean;
  tieneError: boolean;
  esAdoptada: boolean;
};

export function aClientePppoeCuentaReadModel(
  cuenta: ClientePppoeCuentaEntity,
): ClientePppoeCuentaReadModel {
  if (cuenta.id === null) {
    throw new Error('Una cuenta PPPoE sin id no está persistida.');
  }

  return {
    id: cuenta.id,
    empresaId: cuenta.empresaId,
    accesoInternetId: cuenta.accesoInternetId,
    perfilHomologacionId: cuenta.perfilHomologacionId,
    usuario: cuenta.usuario,
    secretoProtegido: cuenta.secretoProtegido,
    estado: cuenta.estado,
    generadoPorId: cuenta.generadoPorId,
    adoptadoPorId: cuenta.adoptadoPorId,
    generadoEn: cuenta.generadoEn,
    secretCreadoEn: cuenta.secretCreadoEn,
    activadoEn: cuenta.activadoEn,
    suspendidoEn: cuenta.suspendidoEn,
    eliminadoEn: cuenta.eliminadoEn,
    adoptadoEn: cuenta.adoptadoEn,
    ultimaSincronizacionEn: cuenta.ultimaSincronizacionEn,
    ultimoError: cuenta.ultimoError,
    actualizadoEn: cuenta.actualizadoEn,
    estaPendienteActivacion: cuenta.estaPendienteActivacion,
    estaActiva: cuenta.estaActiva,
    estaSuspendida: cuenta.estaSuspendida,
    estaEliminada: cuenta.estaEliminada,
    tieneSecretCreado: cuenta.tieneSecretCreado,
    tieneError: cuenta.tieneError,
    esAdoptada: cuenta.esAdoptada,
  };
}
