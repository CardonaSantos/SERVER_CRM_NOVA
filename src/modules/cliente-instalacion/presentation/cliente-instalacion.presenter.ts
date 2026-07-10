import { ClienteInstalacionEntity } from '../domain/entities/cliente-instalacion.entity';
import {
  ClienteInstalacionDetalle,
  ClienteInstalacionEvidenciaDetalle,
  ClienteInstalacionListItem,
  ClienteInstalacionPaginatedResult,
  ClienteInstalacionTecnicoDetalle,
  ClienteInstalacionUsuarioResumen,
} from '../domain/ports/cliente-instalacion.repository.port';

export class ClienteInstalacionPresenter {
  /**
   * Convierte la entidad principal de instalación
   * a una respuesta HTTP serializable.
   */
  static toHttp(entity: ClienteInstalacionEntity) {
    const props = entity.toPrimitives();

    return {
      id: props.id,

      empresaId: props.empresaId,
      clienteId: props.clienteId,

      servicioInternetId: props.servicioInternetId,
      ticketId: props.ticketId,

      asesorId: props.asesorId,
      creadoPorId: props.creadoPorId,
      completadoPorId: props.completadoPorId,

      tipo: props.tipo,
      estado: props.estado,

      fechaProgramada: props.fechaProgramada,
      fechaInicio: props.fechaInicio,
      fechaFinalizacion: props.fechaFinalizacion,
      fechaCancelacion: props.fechaCancelacion,
      fechaActivacionServicio: props.fechaActivacionServicio,

      motivo: props.motivo,
      observaciones: props.observaciones,
      resultado: props.resultado,

      ubicacion: {
        direccion: props.direccionInstalacion,
        referencia: props.referenciaUbicacion,
        latitud: props.latitud,
        longitud: props.longitud,
      },

      wifi: {
        ssid: props.ssidRouter,
      },

      costos: {
        costoInstalacion: props.costoInstalacion.toNumber(),
        costoMateriales: props.costoMateriales.toNumber(),
        costoManoObra: props.costoManoObra.toNumber(),
        costoOtros: props.costoOtros.toNumber(),

        montoCobradoCliente: props.montoCobradoCliente.toNumber(),

        saldoPendiente: props.saldoPendiente.toNumber(),

        notas: props.notasCostos,
      },

      esMigrada: props.esMigrada,
      metadata: props.metadata,

      creadoEn: props.creadoEn,
      actualizadoEn: props.actualizadoEn,
    };
  }

  /**
   * Convierte un usuario relacionado con la instalación.
   */
  private static usuarioToHttp(
    usuario: ClienteInstalacionUsuarioResumen | null,
  ) {
    if (!usuario) {
      return null;
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,

      correo: usuario.correo ?? null,
      telefono: usuario.telefono ?? null,
      avatarUrl: usuario.avatarUrl ?? null,

      activo: usuario.activo,
    };
  }

  /**
   * Convierte una asignación de técnico.
   */
  private static tecnicoToHttp(tecnico: ClienteInstalacionTecnicoDetalle) {
    return {
      id: tecnico.id,
      instalacionId: tecnico.instalacionId,

      tecnicoId: tecnico.tecnicoId ?? null,

      rol: tecnico.rol,
      esResponsable: tecnico.esResponsable,

      tiempoMinutos: tecnico.tiempoMinutos ?? null,

      observaciones: tecnico.observaciones ?? null,

      tecnicoNombreSnapshot: tecnico.tecnicoNombreSnapshot ?? null,

      tecnico: this.usuarioToHttp(tecnico.tecnico),

      creadoEn: tecnico.creadoEn,
      actualizadoEn: tecnico.actualizadoEn,
    };
  }

  /**
   * Convierte una evidencia y su media relacionada.
   */
  private static evidenciaToHttp(
    evidencia: ClienteInstalacionEvidenciaDetalle,
  ) {
    return {
      id: evidencia.id,
      instalacionId: evidencia.instalacionId,

      mediaId: evidencia.mediaId,

      tipo: evidencia.tipo,

      descripcion: evidencia.descripcion ?? null,

      orden: evidencia.orden,

      creadoEn: evidencia.creadoEn,

      media: {
        id: evidencia.media.id,

        cdnUrl: evidencia.media.cdnUrl ?? null,

        key: evidencia.media.key,

        mimeType: evidencia.media.mimeType ?? null,

        extension: evidencia.media.extension ?? null,

        tamanioBytes:
          evidencia.media.tamanioBytes != null
            ? evidencia.media.tamanioBytes.toString()
            : null,

        subidoPor: this.usuarioToHttp(evidencia.media.subidoPor),
      },
    };
  }

  /**
   * Convierte un item ligero del listado paginado.
   */
  private static listItemToHttp(item: ClienteInstalacionListItem) {
    return {
      ...this.toHttp(item.instalacion),

      cliente: {
        id: item.cliente.id,

        nombre: item.cliente.nombre,

        apellidos: item.cliente.apellidos ?? null,

        telefono: item.cliente.telefono ?? null,

        dpi: item.cliente.dpi ?? null,

        direccion: item.cliente.direccion ?? null,
      },

      servicioInternet: item.servicioInternet
        ? {
            id: item.servicioInternet.id,

            nombre: item.servicioInternet.nombre,

            velocidad: item.servicioInternet.velocidad ?? null,

            precio: item.servicioInternet.precio ?? null,
          }
        : null,

      tecnicoResponsable: item.tecnicoResponsable
        ? {
            asignacionId: item.tecnicoResponsable.asignacionId,

            tecnicoId: item.tecnicoResponsable.tecnicoId ?? null,

            nombre: item.tecnicoResponsable.nombre,

            avatarUrl: item.tecnicoResponsable.avatarUrl ?? null,
          }
        : null,

      conteos: {
        tecnicos: item.conteos.tecnicos,
        evidencias: item.conteos.evidencias,
        equipos: item.conteos.equipos,
      },
    };
  }

  /**
   * Convierte el resultado paginado.
   */
  static paginatedToHttp(result: ClienteInstalacionPaginatedResult) {
    return {
      data: result.items.map((item) => this.listItemToHttp(item)),

      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,

        totalPages: result.totalPages ?? Math.ceil(result.total / result.limit),
      },
    };
  }

  /**
   * Convierte el detalle completo de una instalación.
   */
  static detalleToHttp(detalle: ClienteInstalacionDetalle) {
    return {
      ...this.toHttp(detalle.instalacion),

      cliente: {
        id: detalle.cliente.id,

        nombre: detalle.cliente.nombre,

        apellidos: detalle.cliente.apellidos ?? null,

        telefono: detalle.cliente.telefono ?? null,

        dpi: detalle.cliente.dpi ?? null,

        direccion: detalle.cliente.direccion ?? null,
      },

      servicioInternet: detalle.servicioInternet
        ? {
            id: detalle.servicioInternet.id,

            nombre: detalle.servicioInternet.nombre,

            velocidad: detalle.servicioInternet.velocidad ?? null,

            precio: detalle.servicioInternet.precio ?? null,
          }
        : null,

      participantes: {
        asesor: this.usuarioToHttp(detalle.participantes.asesor),

        creadoPor: this.usuarioToHttp(detalle.participantes.creadoPor),

        completadoPor: this.usuarioToHttp(detalle.participantes.completadoPor),
      },

      tecnicos: detalle.tecnicos.map((tecnico) => this.tecnicoToHttp(tecnico)),

      evidencias: detalle.evidencias.map((evidencia) =>
        this.evidenciaToHttp(evidencia),
      ),

      conteos: {
        tecnicos: detalle.conteos.tecnicos,
        evidencias: detalle.conteos.evidencias,
        equipos: detalle.conteos.equipos,
      },
    };
  }
}
