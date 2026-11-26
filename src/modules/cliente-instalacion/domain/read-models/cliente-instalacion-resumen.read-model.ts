import { ClienteInstalacionEntity } from '../entities/cliente-instalacion.entity';
import { EstadoInstalacionCliente } from '../enums/estado-instalacion-cliente.enum';
import { TipoInstalacionCliente } from '../enums/tipo-instalacion-cliente.enum';

/** Datos propios de una instalación, planos y de solo lectura. */
export type ClienteInstalacionResumen = {
  id: number | null;

  empresaId: number;
  clienteId: number;
  servicioInternetId: number | null;
  ticketId: number | null;

  asesorId: number | null;
  creadoPorId: number | null;
  completadoPorId: number | null;

  tipo: TipoInstalacionCliente;
  estado: EstadoInstalacionCliente;

  fechaProgramada: Date | null;
  fechaInicio: Date | null;
  fechaFinalizacion: Date | null;
  fechaCancelacion: Date | null;
  fechaActivacionServicio: Date | null;

  motivo: string | null;
  descripcion: string | null;
  observaciones: string | null;
  resultado: string | null;

  direccionInstalacion: string | null;
  referenciaUbicacion: string | null;
  latitud: number | null;
  longitud: number | null;

  costoInstalacion: number;
  costoMateriales: number;
  costoManoObra: number;
  costoOtros: number;
  montoCobradoCliente: number;
  notasCostos: string | null;

  creadoEn: Date | null;
  actualizadoEn: Date | null;
};

/** Vista plana de la entidad: es lo que los casos de uso entregan hacia afuera. */
export function resumirInstalacion(
  entidad: ClienteInstalacionEntity,
): ClienteInstalacionResumen {
  const p = entidad.toPrimitives();

  return {
    id: p.id ?? null,
    empresaId: p.empresaId,
    clienteId: p.clienteId,
    servicioInternetId: p.servicioInternetId ?? null,
    ticketId: p.ticketId ?? null,
    asesorId: p.asesorId ?? null,
    creadoPorId: p.creadoPorId ?? null,
    completadoPorId: p.completadoPorId ?? null,
    tipo: p.tipo,
    estado: p.estado,
    fechaProgramada: p.fechaProgramada ?? null,
    fechaInicio: p.fechaInicio ?? null,
    fechaFinalizacion: p.fechaFinalizacion ?? null,
    fechaCancelacion: p.fechaCancelacion ?? null,
    fechaActivacionServicio: p.fechaActivacionServicio ?? null,
    motivo: p.motivo ?? null,
    descripcion: p.descripcion ?? null,
    observaciones: p.observaciones ?? null,
    resultado: p.resultado ?? null,
    direccionInstalacion: p.direccionInstalacion ?? null,
    referenciaUbicacion: p.referenciaUbicacion ?? null,
    latitud: p.latitud ?? null,
    longitud: p.longitud ?? null,
    costoInstalacion: p.costoInstalacion.toNumber(),
    costoMateriales: p.costoMateriales.toNumber(),
    costoManoObra: p.costoManoObra.toNumber(),
    costoOtros: p.costoOtros.toNumber(),
    montoCobradoCliente: p.montoCobradoCliente.toNumber(),
    notasCostos: p.notasCostos ?? null,
    creadoEn: p.creadoEn ?? null,
    actualizadoEn: p.actualizadoEn ?? null,
  };
}
