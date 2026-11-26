import { TipoEvidenciaClienteOperacion } from 'src/modules/cliente-instalacion/public/cliente-instalacion.types';
import { RolTecnicoOperacionCliente } from 'src/modules/cliente-instalacion/public/cliente-instalacion.types';
import { ClienteDesinstalacionAutorizacionEntity } from '../entities/cliente-desinstalacion-autorizacion.entity';
import { ClienteDesinstalacionMediaEntity } from '../entities/cliente-desinstalacion-media.entity';
import { ClienteDesinstalacionTecnicoEntity } from '../entities/cliente-desinstalacion-tecnico.entity';
import { ClienteDesinstalacionEntity } from '../entities/cliente-desinstalacion.entity';
import { EstadoAutorizacionDesinstalacion } from '../enums/estado-autorizacion-desinstalacion.enum';
import { EstadoDesinstalacionCliente } from '../enums/estado-desinstalacion-cliente.enum';
import { MotivoDesinstalacionCliente } from '../enums/motivo-desinstalacion-cliente.enum';
import { TipoDesinstalacionCliente } from '../enums/tipo-desinstalacion-cliente.enum';

/** Datos propios de una desinstalación, planos y de solo lectura. */
export type ClienteDesinstalacionResumen = {
  id: number | null;
  empresaId: number;
  clienteId: number;
  servicioInternetId: number | null;
  ticketId: number | null;
  accesoInternetId: number | null;
  solicitadoPorId: number | null;
  ejecutadoPorId: number | null;
  creadoPorId: number | null;
  tipo: TipoDesinstalacionCliente;
  motivo: MotivoDesinstalacionCliente | null;
  estado: EstadoDesinstalacionCliente;
  fechaSolicitud: Date | null;
  fechaProgramada: Date | null;
  fechaInicio: Date | null;
  fechaFinalizacion: Date | null;
  fechaCancelacion: Date | null;
  requiereRetiroEquipo: boolean;
  equipoRecuperado: boolean;
  saldoClienteAlMomento: number;
  costoDesinstalacion: number;
  costoTransporte: number;
  costoManoObra: number;
  costoOtros: number;
  direccionServicio: string | null;
  referenciaUbicacion: string | null;
  latitud: number | null;
  longitud: number | null;
  firmadoPor: string | null;
  dpiFirmante: string | null;
  conforme: boolean | null;
  observaciones: string | null;
  resultado: string | null;
  metadata: unknown;
  creadoEn: Date | null;
  actualizadoEn: Date | null;
};

export type AutorizacionDesinstalacionResumen = {
  id: number | null;
  desinstalacionId: number;
  solicitadoPorId: number | null;
  autorizadoPorId: number | null;
  estado: EstadoAutorizacionDesinstalacion;
  motivoSolicitud: string | null;
  comentarioAutorizador: string | null;
  fechaSolicitud: Date | null;
  fechaRespuesta: Date | null;
};

export type TecnicoDesinstalacionResumen = {
  id: number | null;
  desinstalacionId: number;
  tecnicoId: number | null;
  rol: RolTecnicoOperacionCliente;
  esResponsable: boolean;
  tiempoMinutos: number | null;
  observaciones: string | null;
  tecnicoNombreSnapshot: string | null;
  creadoEn: Date | null;
  actualizadoEn: Date | null;
};

export type EvidenciaDesinstalacionResumen = {
  id: number | null;
  desinstalacionId: number;
  mediaId: number;
  tipo: TipoEvidenciaClienteOperacion;
  descripcion: string | null;
  orden: number;
  creadoEn: Date;
};

export function resumirDesinstalacion(
  entidad: ClienteDesinstalacionEntity,
): ClienteDesinstalacionResumen {
  const p = entidad.toPrimitives();

  return {
    id: p.id ?? null,
    empresaId: p.empresaId,
    clienteId: p.clienteId,
    servicioInternetId: p.servicioInternetId ?? null,
    ticketId: p.ticketId ?? null,
    accesoInternetId: p.accesoInternetId ?? null,
    solicitadoPorId: p.solicitadoPorId ?? null,
    ejecutadoPorId: p.ejecutadoPorId ?? null,
    creadoPorId: p.creadoPorId ?? null,
    tipo: p.tipo,
    motivo: p.motivo ?? null,
    estado: p.estado,
    fechaSolicitud: p.fechaSolicitud ?? null,
    fechaProgramada: p.fechaProgramada ?? null,
    fechaInicio: p.fechaInicio ?? null,
    fechaFinalizacion: p.fechaFinalizacion ?? null,
    fechaCancelacion: p.fechaCancelacion ?? null,
    requiereRetiroEquipo: p.requiereRetiroEquipo,
    equipoRecuperado: p.equipoRecuperado,
    saldoClienteAlMomento: p.saldoClienteAlMomento.toNumber(),
    costoDesinstalacion: p.costoDesinstalacion.toNumber(),
    costoTransporte: p.costoTransporte.toNumber(),
    costoManoObra: p.costoManoObra.toNumber(),
    costoOtros: p.costoOtros.toNumber(),
    direccionServicio: p.direccionServicio ?? null,
    referenciaUbicacion: p.referenciaUbicacion ?? null,
    latitud: p.latitud ?? null,
    longitud: p.longitud ?? null,
    firmadoPor: p.firmadoPor ?? null,
    dpiFirmante: p.dpiFirmante ?? null,
    conforme: p.conforme ?? null,
    observaciones: p.observaciones ?? null,
    resultado: p.resultado ?? null,
    metadata: p.metadata ?? null,
    creadoEn: p.creadoEn ?? null,
    actualizadoEn: p.actualizadoEn ?? null,
  };
}

export function resumirAutorizacion(
  entidad: ClienteDesinstalacionAutorizacionEntity,
): AutorizacionDesinstalacionResumen {
  const p = entidad.toPrimitives();

  return {
    id: p.id ?? null,
    desinstalacionId: p.desinstalacionId,
    solicitadoPorId: p.solicitadoPorId ?? null,
    autorizadoPorId: p.autorizadoPorId ?? null,
    estado: p.estado,
    motivoSolicitud: p.motivoSolicitud ?? null,
    comentarioAutorizador: p.comentarioAutorizador ?? null,
    fechaSolicitud: p.fechaSolicitud ?? null,
    fechaRespuesta: p.fechaRespuesta ?? null,
  };
}

export function resumirTecnico(
  entidad: ClienteDesinstalacionTecnicoEntity,
): TecnicoDesinstalacionResumen {
  const p = entidad.toPrimitives();

  return {
    id: p.id ?? null,
    desinstalacionId: p.desinstalacionId,
    tecnicoId: p.tecnicoId ?? null,
    rol: p.rol,
    esResponsable: p.esResponsable,
    tiempoMinutos: p.tiempoMinutos ?? null,
    observaciones: p.observaciones ?? null,
    tecnicoNombreSnapshot: p.tecnicoNombreSnapshot ?? null,
    creadoEn: p.creadoEn ?? null,
    actualizadoEn: p.actualizadoEn ?? null,
  };
}

export function resumirEvidencia(
  entidad: ClienteDesinstalacionMediaEntity,
): EvidenciaDesinstalacionResumen {
  const p = entidad.toPrimitives();

  return {
    id: p.id,
    desinstalacionId: p.desinstalacionId,
    mediaId: p.mediaId,
    tipo: p.tipo,
    descripcion: p.descripcion,
    orden: p.orden,
    creadoEn: p.creadoEn,
  };
}
