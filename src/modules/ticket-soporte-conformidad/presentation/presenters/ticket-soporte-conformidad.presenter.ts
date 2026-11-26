import { CrearTicketConformidadResult } from '../../application/use-cases/crear-ticket-conformidad.use-case';
import { RegistrarFirmaTecnicoTicketConformidadResult } from '../../application/use-cases/registrar-firma-tecnico-ticket-conformidad.use-case';
import {
  TicketConformidadClienteReadModel,
  TicketConformidadDetalleReadModel,
  TicketConformidadFirmaReadModel,
  TicketConformidadHistorialReadModel,
  TicketConformidadPersonaReadModel,
  TicketConformidadTicketReadModel,
} from '../../domain/read-models/ticket-soporte-conformidad.read-model';
import {
  TicketConformidadClienteResponseDto,
  TicketConformidadCreadaResponseDto,
  TicketConformidadDetalleResponseDto,
  TicketConformidadFirmaResponseDto,
  TicketConformidadHistorialResponseDto,
  TicketConformidadPersonaResponseDto,
  TicketConformidadResumenResponseDto,
  TicketConformidadTicketResponseDto,
  TicketFirmaTecnicoResponseDto,
} from '../dto/ticket-soporte-conformidad-response.dto';

const iso = (fecha: Date | null): string | null =>
  fecha ? fecha.toISOString() : null;

export class TicketSoporteConformidadPresenter {
  static creada(
    resultado: CrearTicketConformidadResult,
  ): TicketConformidadCreadaResponseDto {
    return {
      id: resultado.id as number,
      ticketId: resultado.ticketId,
      clienteId: resultado.clienteId,
      tecnicoAsignadoId: resultado.tecnicoAsignadoId,
      creadoPorId: resultado.creadoPorId,
      resultado: resultado.resultado,
      creadoEn: resultado.creadoEn.toISOString(),
      actualizadoEn: resultado.actualizadoEn.toISOString(),
      respondidoEn: iso(resultado.respondidoEn),
    };
  }

  static firmaTecnico(
    resultado: RegistrarFirmaTecnicoTicketConformidadResult,
  ): TicketFirmaTecnicoResponseDto {
    return {
      conformidadId: resultado.conformidadId,
      firmaId: resultado.firmaId,
      mediaId: resultado.mediaId,
      usuarioFirmanteId: resultado.usuarioFirmanteId,
      nombreFirmante: resultado.nombreFirmante,
      firmadoEn: resultado.firmadoEn.toISOString(),
    };
  }

  static detalle(
    detalle: TicketConformidadDetalleReadModel,
  ): TicketConformidadDetalleResponseDto {
    return {
      id: detalle.id,
      ticketId: detalle.ticketId,
      clienteId: detalle.clienteId,
      tecnicoAsignadoId: detalle.tecnicoAsignadoId,
      creadoPorId: detalle.creadoPorId,
      resultado: detalle.resultado,
      creadoEn: detalle.creadoEn.toISOString(),
      actualizadoEn: detalle.actualizadoEn.toISOString(),
      respondidoEn: iso(detalle.respondidoEn),
      ticket: TicketSoporteConformidadPresenter.ticket(detalle.ticket),
      cliente: TicketSoporteConformidadPresenter.cliente(detalle.cliente),
      tecnicoAsignado: TicketSoporteConformidadPresenter.persona(
        detalle.tecnicoAsignado,
      ),
      creadoPor: TicketSoporteConformidadPresenter.persona(detalle.creadoPor),
      firmas: detalle.firmas.map((firma) =>
        TicketSoporteConformidadPresenter.firma(firma),
      ),
      resumen: TicketSoporteConformidadPresenter.resumen(detalle.resumen),
    };
  }

  static historial(
    historial: TicketConformidadHistorialReadModel,
  ): TicketConformidadHistorialResponseDto {
    const { resumen } = historial;

    return {
      ticket: TicketSoporteConformidadPresenter.ticket(historial.ticket),
      conformidades: historial.conformidades.map((item) =>
        TicketSoporteConformidadPresenter.detalle(item),
      ),
      resumen: {
        totalSolicitudes: resumen.totalSolicitudes,
        totalConformes: resumen.totalConformes,
        totalRetrabajos: resumen.totalRetrabajos,
        totalPendientes: resumen.totalPendientes,
        totalFirmasCliente: resumen.totalFirmasCliente,
        totalFirmasTecnico: resumen.totalFirmasTecnico,
        requirioRetrabajoAlgunaVez: resumen.requirioRetrabajoAlgunaVez,
        resultadoActual: resumen.resultadoActual,
        primeraSolicitudEn: iso(resumen.primeraSolicitudEn),
        ultimaSolicitudEn: iso(resumen.ultimaSolicitudEn),
        ultimaRespuestaEn: iso(resumen.ultimaRespuestaEn),
        tiempoPromedioRespuestaMinutos: resumen.tiempoPromedioRespuestaMinutos,
      },
    };
  }

  private static ticket(
    ticket: TicketConformidadTicketReadModel,
  ): TicketConformidadTicketResponseDto {
    return {
      id: ticket.id,
      estado: ticket.estado,
      prioridad: ticket.prioridad,
      titulo: ticket.titulo,
      descripcion: ticket.descripcion,
      fechaApertura: ticket.fechaApertura.toISOString(),
      fechaAsignacion: iso(ticket.fechaAsignacion),
      fechaInicioAtencion: iso(ticket.fechaInicioAtencion),
      fechaResolucionTecnico: iso(ticket.fechaResolucionTecnico),
      fechaCierre: iso(ticket.fechaCierre),
      fijado: ticket.fijado,
      clienteActual: TicketSoporteConformidadPresenter.cliente(
        ticket.clienteActual,
      ),
      tecnicoActual: TicketSoporteConformidadPresenter.persona(
        ticket.tecnicoActual,
      ),
      creadoPor: TicketSoporteConformidadPresenter.persona(ticket.creadoPor),
    };
  }

  private static firma(
    firma: TicketConformidadFirmaReadModel,
  ): TicketConformidadFirmaResponseDto {
    return {
      id: firma.id,
      tipo: firma.tipo,
      origen: firma.origen,
      nombreFirmante: firma.nombreFirmante,
      firmadoEn: firma.firmadoEn.toISOString(),
      usuarioFirmante: TicketSoporteConformidadPresenter.persona(
        firma.usuarioFirmante,
      ),
      media: {
        id: firma.media.id,
        cdnUrl: firma.media.cdnUrl,
        mimeType: firma.media.mimeType,
      },
    };
  }

  private static resumen(
    resumen: TicketConformidadDetalleReadModel['resumen'],
  ): TicketConformidadResumenResponseDto {
    return {
      tieneFirmaCliente: resumen.tieneFirmaCliente,
      tieneFirmaTecnico: resumen.tieneFirmaTecnico,
      firmaClienteEn: iso(resumen.firmaClienteEn),
      firmaTecnicoEn: iso(resumen.firmaTecnicoEn),
      cantidadFirmas: resumen.cantidadFirmas,
      requiereRetrabajo: resumen.requiereRetrabajo,
      estaConforme: resumen.estaConforme,
      estaPendiente: resumen.estaPendiente,
      tiempoRespuestaMinutos: resumen.tiempoRespuestaMinutos,
    };
  }

  private static persona(
    persona: TicketConformidadPersonaReadModel | null,
  ): TicketConformidadPersonaResponseDto | null {
    return persona ? { id: persona.id, nombre: persona.nombre } : null;
  }

  private static cliente(
    cliente: TicketConformidadClienteReadModel | null,
  ): TicketConformidadClienteResponseDto | null {
    return cliente
      ? {
          id: cliente.id,
          nombreCompleto: cliente.nombreCompleto,
          telefono: cliente.telefono,
          direccion: cliente.direccion,
        }
      : null;
  }
}
