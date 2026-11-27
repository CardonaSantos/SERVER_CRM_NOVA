import {
  presentarPaginado,
  RespuestaPaginada,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { ObtenerBoletaTicketResult } from '../../application/use-cases/obtener-boleta-ticket.use-case';
import { ObtenerTicketResult } from '../../application/use-cases/obtener-ticket.use-case';
import {
  ContadoresBandeja,
  faseDe,
} from '../../domain/policies/fase-ticket.policy';
import { TicketProps } from '../../domain/props/ticket.props';
import { OpcionesTicket } from '../../domain/read-models/catalogo-ticket.read-model';
import { FirmaBoleta } from '../../domain/read-models/ticket-boleta.read-model';
import {
  ClienteDeTicket,
  TicketListItem,
} from '../../domain/read-models/ticket-listado.read-model';
import {
  ClienteTicketResponseDto,
  ContadoresTicketResponseDto,
  TicketDetalleResponseDto,
  TicketResponseDto,
} from '../dto/ticket-response.dto';

const iso = (fecha: Date | null) => fecha?.toISOString() ?? null;

const persona = (p: { id: number; nombre: string }) => ({
  id: p.id,
  nombre: p.nombre,
});

const opcional = (p: { id: number; nombre: string } | null) =>
  p ? persona(p) : null;

export class TicketPresenter {
  static item(m: TicketListItem): TicketResponseDto {
    return {
      id: m.id,
      titulo: m.titulo,
      estado: faseDe(m.estado),
      prioridad: m.prioridad,
      fijado: m.fijado,
      cliente: m.cliente ? TicketPresenter.cliente(m.cliente) : null,
      tecnico: opcional(m.tecnico),
      apoyos: m.apoyos.map(persona),
      etiquetas: m.etiquetas.map(persona),
      creadoPor: opcional(m.creadoPor),
      abiertoEn: m.fechaApertura.toISOString(),
      cerradoEn: iso(m.fechaCierre),
      ultimaActividadEn: m.ultimaActividadEn.toISOString(),
      totalComentarios: m.totalComentarios,
      totalImagenes: m.totalImagenes,
    };
  }

  static listado(
    resultado: ResultadoPaginado<TicketListItem>,
  ): RespuestaPaginada<TicketResponseDto> {
    return presentarPaginado(resultado, (m) => TicketPresenter.item(m));
  }

  static detalle(r: ObtenerTicketResult): TicketDetalleResponseDto {
    const t = r.ticket;
    const cliente = t.cliente;

    return {
      ...TicketPresenter.item(t),
      cliente: cliente
        ? {
            ...TicketPresenter.cliente(cliente),
            telefonoReferencia: cliente.telefonoReferencia,
            municipio: cliente.municipio,
            departamento: cliente.departamento,
            observaciones: cliente.observaciones,
            archivos: cliente.archivos.map((archivo) => ({
              id: archivo.id,
              url: archivo.url,
              titulo: archivo.titulo,
              descripcion: archivo.descripcion,
              creadoEn: archivo.creadoEn.toISOString(),
            })),
          }
        : null,
      descripcion: t.descripcion,
      fechas: {
        asignadoEn: iso(t.fechaAsignacion),
        iniciadoEn: iso(t.fechaInicioAtencion),
        entregadoEn: iso(t.fechaResolucionTecnico),
      },
      cancelacion: t.cancelacion
        ? {
            fecha: t.cancelacion.fecha.toISOString(),
            motivo: t.cancelacion.motivo,
            por: opcional(t.cancelacion.por),
          }
        : null,
      resumen: t.resumen
        ? {
            solucion: opcional(t.resumen.solucion),
            resueltoComo: t.resumen.resueltoComo,
            notasInternas: t.resumen.notasInternas,
            tiempoTotalMinutos: t.resumen.tiempoTotalMinutos,
            tiempoTecnicoMinutos: t.resumen.tiempoTecnicoMinutos,
            numeroReaperturas: t.resumen.numeroReaperturas,
          }
        : null,
      tiempoTrabajado: {
        minutos: r.tiempoTrabajado.minutos,
        corriendoDesde: iso(r.tiempoTrabajado.corriendoDesde),
      },
      acciones: r.acciones,
      puedeEditar: r.puedeEditar,
    };
  }

  static contadores(c: ContadoresBandeja): ContadoresTicketResponseDto {
    return {
      activos: c.activos,
      abiertos: c.abiertos,
      enProceso: c.enProceso,
      enRevision: c.enRevision,
      resueltos: c.resueltos,
      cancelados: c.cancelados,
      todos: c.todos,
    };
  }

  static opciones(o: OpcionesTicket) {
    return {
      tecnicos: o.tecnicos.map((t) => ({ ...persona(t), rol: t.rol })),
      sectores: o.sectores.map((s) => ({
        ...persona(s),
        municipio: s.municipio,
      })),
      etiquetas: o.etiquetas.map(persona),
      soluciones: o.soluciones.map((s) => ({
        ...persona(s),
        descripcion: s.descripcion,
      })),
    };
  }

  static boleta(b: ObtenerBoletaTicketResult) {
    const firma = (f: FirmaBoleta | null) =>
      f
        ? {
            id: f.id,
            nombreFirmante: f.nombreFirmante,
            telefonoFirmante: f.telefonoFirmante,
            usuarioFirmanteId: f.usuarioFirmanteId,
            firmadoEn: f.firmadoEn.toISOString(),
            url: f.url,
            mimeType: f.mimeType,
          }
        : null;

    return {
      ticketId: b.ticketId,
      titulo: b.titulo,
      descripcion: b.descripcion,
      estado: faseDe(b.estado),
      prioridad: b.prioridad,
      abiertoEn: b.fechaApertura.toISOString(),
      cerradoEn: iso(b.fechaCierre),
      cliente: b.cliente,
      tecnico: opcional(b.tecnico),
      empresa: b.empresa,
      conformidad: b.conformidad
        ? {
            id: b.conformidad.id,
            resultado: b.conformidad.resultado,
            creadoEn: b.conformidad.creadoEn.toISOString(),
            respondidoEn: iso(b.conformidad.respondidoEn),
          }
        : null,
      firmaCliente: firma(b.firmaCliente),
      firmaTecnico: firma(b.firmaTecnico),
      generadaEn: b.generadaEn.toISOString(),
    };
  }

  /** El bot externo recibe los mismos campos que recibía antes. */
  static bot(t: TicketProps) {
    return {
      id: t.id,
      clienteId: t.clienteId,
      empresaId: t.empresaId,
      tecnicoId: t.tecnicoId,
      creadoPorId: t.creadoPorId,
      estado: t.estado,
      prioridad: t.prioridad,
      titulo: t.titulo,
      descripcion: t.descripcion,
      fechaCierre: iso(t.fechaCierre),
      fechaApertura: t.fechaApertura.toISOString(),
      fechaAsignacion: iso(t.fechaAsignacion),
      fechaInicioAtencion: iso(t.fechaInicioAtencion),
      fechaResolucionTecnico: iso(t.fechaResolucionTecnico),
      creadoEn: t.fechaApertura.toISOString(),
      actualizadoEn: t.actualizadoEn.toISOString(),
      fijado: t.fijado,
    };
  }

  private static cliente(c: ClienteDeTicket): ClienteTicketResponseDto {
    return {
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono,
      direccion: c.direccion,
      sector: c.sector ? persona(c.sector) : null,
      ubicacion: c.ubicacion,
    };
  }
}
