import { CrearClienteDesinstalacionResult } from '../application/use-cases/crear-desinstalacion.use-case';

import { ClienteDesinstalacionEntity } from '../domain/entities/cliente-desinstalacion.entitie';

import { ClienteDesInstalacionPaginatedResult } from '../domain/ports/cliente-desinstalacion.repository.port';

import {
  ClienteDesinstalacionDetalle,
  ClienteDesinstalacionListadoItem,
} from '../domain/read-models/cliente-desinstalacion.read-model';

import { ClienteDesinstalacionTecnicoPresenter } from './cliente-desinstalacion-tecnico.presenter';

export class ClienteDesinstalacionPresenter {
  /**
   * Presentación básica de la entidad.
   *
   * Se utiliza en:
   *
   * - creación;
   * - actualización;
   * - reprogramación;
   * - costos;
   * - transiciones operativas.
   */
  static toHttp(entity: ClienteDesinstalacionEntity) {
    const props = entity.toPrimitives();

    return {
      id: props.id,

      empresaId: props.empresaId,

      clienteId: props.clienteId,

      servicioInternetId: props.servicioInternetId ?? null,

      ticketId: props.ticketId ?? null,

      accesoInternetId: props.accesoInternetId ?? null,

      solicitadoPorId: props.solicitadoPorId ?? null,

      ejecutadoPorId: props.ejecutadoPorId ?? null,

      creadoPorId: props.creadoPorId ?? null,

      tipo: props.tipo,

      motivo: props.motivo ?? null,

      estado: props.estado,

      fechaSolicitud: props.fechaSolicitud ?? null,

      fechaProgramada: props.fechaProgramada ?? null,

      fechaInicio: props.fechaInicio ?? null,

      fechaFinalizacion: props.fechaFinalizacion ?? null,

      fechaCancelacion: props.fechaCancelacion ?? null,

      requiereRetiroEquipo: props.requiereRetiroEquipo,

      equipoRecuperado: props.equipoRecuperado,

      costos: {
        saldoClienteAlMomento: props.saldoClienteAlMomento.toNumber(),

        costoDesinstalacion: props.costoDesinstalacion.toNumber(),

        costoTransporte: props.costoTransporte.toNumber(),

        costoManoObra: props.costoManoObra.toNumber(),

        costoOtros: props.costoOtros.toNumber(),
      },

      direccionServicio: props.direccionServicio ?? null,

      referenciaUbicacion: props.referenciaUbicacion ?? null,

      latitud: props.latitud ?? null,

      longitud: props.longitud ?? null,

      firmadoPor: props.firmadoPor ?? null,

      dpiFirmante: props.dpiFirmante ?? null,

      conforme: props.conforme ?? null,

      observaciones: props.observaciones ?? null,

      resultado: props.resultado ?? null,

      metadata: props.metadata ?? null,

      creadoEn: props.creadoEn ?? null,

      actualizadoEn: props.actualizadoEn ?? null,
    };
  }

  /**
   * Presenta un elemento del listado enriquecido.
   *
   * Incluye las relaciones resumidas más importantes,
   * sin cargar todas las colecciones del detalle.
   */
  static listadoItemToHttp(item: ClienteDesinstalacionListadoItem) {
    return {
      ...this.toHttp(item.desinstalacion),

      cliente: {
        id: item.cliente.id,

        nombre: item.cliente.nombre,

        apellidos: item.cliente.apellidos,

        telefono: item.cliente.telefono,

        dpi: item.cliente.dpi,

        direccion: item.cliente.direccion,
      },

      servicioInternet: item.servicioInternet
        ? {
            id: item.servicioInternet.id,

            nombre: item.servicioInternet.nombre,

            velocidad: item.servicioInternet.velocidad,

            precio: item.servicioInternet.precio,
          }
        : null,

      ticket: item.ticket
        ? {
            id: item.ticket.id,

            titulo: item.ticket.titulo,

            descripcion: item.ticket.descripcion,

            estado: item.ticket.estado,

            prioridad: item.ticket.prioridad,

            fechaApertura: item.ticket.fechaApertura,

            fechaCierre: item.ticket.fechaCierre,
          }
        : null,

      solicitadoPor: item.solicitadoPor,

      ejecutadoPor: item.ejecutadoPor,

      creadoPor: item.creadoPor,

      accesoInternet: item.accesoInternet
        ? {
            id: item.accesoInternet.id,

            clienteId: item.accesoInternet.clienteId,

            servicioInternetId: item.accesoInternet.servicioInternetId,

            tecnologia: item.accesoInternet.tecnologia,

            metodoAutenticacion: item.accesoInternet.metodoAutenticacion,

            estado: item.accesoInternet.estado,

            activadoEn: item.accesoInternet.activadoEn,

            suspendidoEn: item.accesoInternet.suspendidoEn,

            dadoDeBajaEn: item.accesoInternet.dadoDeBajaEn,

            creadoEn: item.accesoInternet.creadoEn,

            actualizadoEn: item.accesoInternet.actualizadoEn,

            cuentaPppoe: item.accesoInternet.cuentaPppoe
              ? {
                  id: item.accesoInternet.cuentaPppoe.id,

                  usuario: item.accesoInternet.cuentaPppoe.usuario,

                  estado: item.accesoInternet.cuentaPppoe.estado,

                  perfilHomologacionId:
                    item.accesoInternet.cuentaPppoe.perfilHomologacionId,

                  generadoEn: item.accesoInternet.cuentaPppoe.generadoEn,

                  secretCreadoEn:
                    item.accesoInternet.cuentaPppoe.secretCreadoEn,

                  activadoEn: item.accesoInternet.cuentaPppoe.activadoEn,

                  suspendidoEn: item.accesoInternet.cuentaPppoe.suspendidoEn,

                  eliminadoEn: item.accesoInternet.cuentaPppoe.eliminadoEn,

                  ultimaSincronizacionEn:
                    item.accesoInternet.cuentaPppoe.ultimaSincronizacionEn,

                  ultimoError: item.accesoInternet.cuentaPppoe.ultimoError,
                }
              : null,
          }
        : null,

      tecnicoResponsable: item.tecnicoResponsable,

      ultimaAutorizacion: item.ultimaAutorizacion,

      ultimaOperacionPppoe: item.ultimaOperacionPppoe,

      conteos: item.conteos,
    };
  }

  /**
   * Presenta el detalle completo de una desinstalación.
   */
  static detalleToHttp(detalle: ClienteDesinstalacionDetalle) {
    return {
      ...this.listadoItemToHttp(detalle),

      tecnicos: detalle.tecnicos.map((tecnico) =>
        this.tecnicoDetalleToHttp(tecnico),
      ),

      evidencias: detalle.evidencias.map((evidencia) =>
        this.evidenciaToHttp(evidencia),
      ),

      equipos: detalle.equipos.map((equipo) => this.equipoToHttp(equipo)),

      gastosOperativos: detalle.gastosOperativos.map((gasto) =>
        this.gastoToHttp(gasto),
      ),

      autorizaciones: detalle.autorizaciones.map((autorizacion) => ({
        ...autorizacion,
      })),

      operacionesPppoe: detalle.operacionesPppoe.map((operacion) => ({
        ...operacion,

        pasos: operacion.pasos.map((paso) => ({
          ...paso,
        })),
      })),

      auditoriasPppoe: detalle.auditoriasPppoe.map((auditoria) => ({
        ...auditoria,
      })),
    };
  }

  /**
   * Presenta el listado paginado mediante el contrato
   * uniforme de la API.
   */
  static paginatedToHttp(result: ClienteDesInstalacionPaginatedResult) {
    return {
      data: result.data.map((item) => this.listadoItemToHttp(item)),

      meta: {
        total: result.meta.total,

        page: result.meta.page,

        limit: result.meta.limit,

        totalPages: result.meta.totalPages,
      },
    };
  }

  /**
   * Presenta el resultado inmediato de creación.
   *
   * La creación todavía devuelve entidades de técnicos,
   * no el read model enriquecido.
   */
  static crearToHttp(result: CrearClienteDesinstalacionResult) {
    return {
      ...this.toHttp(result.desinstalacion),

      tecnicos: result.tecnicos.map((tecnico) =>
        ClienteDesinstalacionTecnicoPresenter.toHttp(tecnico),
      ),
    };
  }

  private static tecnicoDetalleToHttp(
    tecnico: ClienteDesinstalacionDetalle['tecnicos'][number],
  ) {
    return {
      id: tecnico.id,

      desinstalacionId: tecnico.desinstalacionId,

      tecnicoId: tecnico.tecnicoId,

      rol: tecnico.rol,

      esResponsable: tecnico.esResponsable,

      tiempoMinutos: tecnico.tiempoMinutos,

      observaciones: tecnico.observaciones,

      tecnicoNombreSnapshot: tecnico.tecnicoNombreSnapshot,

      creadoEn: tecnico.creadoEn,

      actualizadoEn: tecnico.actualizadoEn,

      tecnico: tecnico.tecnico,
    };
  }

  private static evidenciaToHttp(
    evidencia: ClienteDesinstalacionDetalle['evidencias'][number],
  ) {
    return {
      id: evidencia.id,

      desinstalacionId: evidencia.desinstalacionId,

      mediaId: evidencia.mediaId,

      tipo: evidencia.tipo,

      descripcion: evidencia.descripcion,

      orden: evidencia.orden,

      creadoEn: evidencia.creadoEn,

      media: {
        id: evidencia.media.id,

        categoria: evidencia.media.categoria,

        tipo: evidencia.media.tipo,

        estado: evidencia.media.estado,

        cdnUrl: evidencia.media.cdnUrl,

        mimeType: evidencia.media.mimeType,

        extension: evidencia.media.extension,

        tamanioBytes: evidencia.media.tamanioBytes,

        ancho: evidencia.media.ancho,

        alto: evidencia.media.alto,

        titulo: evidencia.media.titulo,

        descripcion: evidencia.media.descripcion,

        tomadoEn: evidencia.media.tomadoEn,

        creadoEn: evidencia.media.creadoEn,
      },
    };
  }

  private static equipoToHttp(
    equipo: ClienteDesinstalacionDetalle['equipos'][number],
  ) {
    return {
      id: equipo.id,

      desinstalacionId: equipo.desinstalacionId,

      productoId: equipo.productoId,

      serialProductoId: equipo.serialProductoId,

      movimientoInventarioId: equipo.movimientoInventarioId,

      bodegaDestinoId: equipo.bodegaDestinoId,

      accesoEquipoId: equipo.accesoEquipoId,

      descripcion: equipo.descripcion,

      cantidad: equipo.cantidad,

      estadoRetiro: equipo.estadoRetiro,

      costoRecuperacion: equipo.costoRecuperacion,

      serialSnapshot: equipo.serialSnapshot,

      notas: equipo.notas,

      creadoEn: equipo.creadoEn,

      actualizadoEn: equipo.actualizadoEn,

      producto: equipo.producto,

      serialProducto: equipo.serialProducto,

      bodegaDestino: equipo.bodegaDestino,
    };
  }

  private static gastoToHttp(
    gasto: ClienteDesinstalacionDetalle['gastosOperativos'][number],
  ) {
    return {
      id: gasto.id,

      tipoGasto: gasto.tipoGasto,

      subtipo: gasto.subtipo,

      descripcion: gasto.descripcion,

      montoTotal: gasto.montoTotal,

      esRecuperable: gasto.esRecuperable,

      estado: gasto.estado,

      fechaGasto: gasto.fechaGasto,

      aprobadoEn: gasto.aprobadoEn,

      registradoPor: gasto.registradoPor,

      aprobadoPor: gasto.aprobadoPor,

      evidencia: gasto.evidencia,
    };
  }
}
