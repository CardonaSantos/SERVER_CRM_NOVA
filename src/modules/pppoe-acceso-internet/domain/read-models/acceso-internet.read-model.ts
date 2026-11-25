import { ClienteAccesoInternetEntity } from '../entities/cliente-acceso-internet.entity';
import {
  EstadoAccesoInternet,
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from '../enums/cliente-acceso-internet.enum';

/** Foto de solo lectura de un acceso de internet ya persistido. */
export type AccesoInternetReadModel = {
  id: number;
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

export function aAccesoInternetReadModel(
  entity: ClienteAccesoInternetEntity,
): AccesoInternetReadModel {
  const p = entity.toPrimitives();

  if (p.id === null) {
    throw new Error('Un acceso sin id no está persistido.');
  }

  return {
    id: p.id,
    empresaId: p.empresaId,
    clienteId: p.clienteId,
    servicioInternetId: p.servicioInternetId,
    tecnologia: p.tecnologia,
    metodoAutenticacion: p.metodoAutenticacion,
    estado: p.estado,
    activadoEn: p.activadoEn ? new Date(p.activadoEn) : null,
    suspendidoEn: p.suspendidoEn ? new Date(p.suspendidoEn) : null,
    dadoDeBajaEn: p.dadoDeBajaEn ? new Date(p.dadoDeBajaEn) : null,
    creadoEn: new Date(p.creadoEn),
    actualizadoEn: new Date(p.actualizadoEn),
  };
}
