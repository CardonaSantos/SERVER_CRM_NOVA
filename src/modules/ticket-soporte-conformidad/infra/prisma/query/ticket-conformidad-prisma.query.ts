import { Injectable } from '@nestjs/common';
import {
  Prisma,
  TicketConformidadCanal as PrismaTicketConformidadCanal,
  TicketConformidadResultado as PrismaTicketConformidadResultado,
  TicketFirmaOrigen as PrismaTicketFirmaOrigen,
  TicketFirmaTipo as PrismaTicketFirmaTipo,
} from '@prisma/client';

import { TicketConformidadCanal } from '../../../domain/enums/ticket-conformidad-canal.enum';
import { TicketConformidadResultado } from '../../../domain/enums/ticket-conformidad-resultado.enum';
import { TicketFirmaOrigen } from '../../../domain/enums/ticket-firma-origen.enum';
import { TicketFirmaTipo } from '../../../domain/enums/ticket-firma-tipo.enum';
import { TicketConformidadQueryPort } from 'src/modules/ticket-soporte-conformidad/application/port/ticket-conformidad-query.port';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  TicketConformidadClienteReadModel,
  TicketConformidadDetalleReadModel,
  TicketConformidadEnlaceEstadoReadModel,
  TicketConformidadEnlaceReadModel,
  TicketConformidadFirmaReadModel,
  TicketConformidadHistorialReadModel,
  TicketConformidadMediaReadModel,
  TicketConformidadTicketReadModel,
  TicketConformidadUsuarioReadModel,
} from 'src/modules/ticket-soporte-conformidad/application/models/ticket-conformidad-read.model';

/* =========================================================
 * PRISMA SELECTS
 * ======================================================= */

const usuarioReadSelect = {
  id: true,

  empresaId: true,

  nombre: true,
  correo: true,
  telefono: true,

  rol: true,

  activo: true,
} satisfies Prisma.UsuarioSelect;

/* --------------------------------------------------------- */

const clienteReadSelect = {
  id: true,

  empresaId: true,
  asesorId: true,

  nombre: true,
  apellidos: true,

  dpi: true,

  observaciones: true,
  nota: true,

  telefono: true,
  direccion: true,

  contactoReferenciaNombre: true,
  contactoReferenciaTelefono: true,

  ssidRouter: true,

  fechaInstalacion: true,

  servicioInternetId: true,
  sectorId: true,

  municipioId: true,
  departamentoId: true,
  facturacionZonaId: true,

  mikrotikRouterId: true,

  estadoCliente: true,
  estadoCobranza: true,
  estadoServicioMikrotik: true,

  enviarRecordatorio: true,

  isEliminado: true,
  eliminadoEn: true,
  desinstaladoEn: true,

  whatsappActivo: true,
  whatsappDesactivadoEn: true,
  whatsappDesactivadoPorId: true,
  motivoWhatsappDesactivado: true,

  creadoEn: true,
  actualizadoEn: true,

  asesor: {
    select: usuarioReadSelect,
  },
} satisfies Prisma.ClienteInternetSelect;

/* --------------------------------------------------------- */

const mediaReadSelect = {
  id: true,

  empresaId: true,
  clienteId: true,
  albumId: true,
  subidoPorId: true,

  categoria: true,
  tipo: true,
  estado: true,

  bucket: true,
  region: true,

  key: true,
  cdnUrl: true,

  mimeType: true,
  extension: true,

  tamanioBytes: true,

  ancho: true,
  alto: true,

  checksumSha256: true,

  titulo: true,
  descripcion: true,
  etiqueta: true,

  orden: true,

  tomadoEn: true,

  publico: true,
  eliminadoEn: true,

  metadatos: true,

  notas: true,

  creadoEn: true,
  actualizadoEn: true,

  subidoPor: {
    select: usuarioReadSelect,
  },
} satisfies Prisma.MediaSelect;

/* --------------------------------------------------------- */

const ticketReadSelect = {
  id: true,

  clienteId: true,
  empresaId: true,
  tecnicoId: true,
  creadoPorId: true,

  estado: true,
  prioridad: true,

  titulo: true,
  descripcion: true,

  fechaApertura: true,
  fechaAsignacion: true,
  fechaInicioAtencion: true,
  fechaResolucionTecnico: true,
  fechaCierre: true,

  creadoEn: true,
  actualizadoEn: true,

  fijado: true,

  cliente: {
    select: clienteReadSelect,
  },

  tecnico: {
    select: usuarioReadSelect,
  },

  creadoPor: {
    select: usuarioReadSelect,
  },
} satisfies Prisma.TicketSoporteSelect;

/* --------------------------------------------------------- */

const firmaReadSelect = {
  id: true,

  conformidadId: true,
  mediaId: true,

  tipo: true,

  usuarioFirmanteId: true,

  nombreFirmante: true,
  telefonoFirmante: true,

  origen: true,

  ipOrigen: true,
  userAgent: true,

  firmadoEn: true,

  usuarioFirmante: {
    select: usuarioReadSelect,
  },

  media: {
    select: mediaReadSelect,
  },
} satisfies Prisma.TicketFirmaSelect;

/* --------------------------------------------------------- */

const enlaceReadSelect = {
  id: true,

  conformidadId: true,

  /**
   * tokenHash NO se selecciona.
   */

  canal: true,

  telefonoDestino: true,

  expiraEn: true,

  usadoEn: true,
  revocadoEn: true,

  creadoPorId: true,

  creadoEn: true,

  creadoPor: {
    select: usuarioReadSelect,
  },
} satisfies Prisma.TicketConformidadEnlaceSelect;

/* --------------------------------------------------------- */

/**
 * Parte reutilizable de TicketConformidad.
 *
 * No incluye ticket porque para el historial obtenemos el ticket
 * una sola vez y reutilizamos ese read model en todos los ciclos.
 */
const conformidadCoreSelect = {
  id: true,

  ticketId: true,

  clienteId: true,
  tecnicoAsignadoId: true,
  creadoPorId: true,

  resultado: true,

  creadoEn: true,
  actualizadoEn: true,
  respondidoEn: true,

  cliente: {
    select: clienteReadSelect,
  },

  tecnicoAsignado: {
    select: usuarioReadSelect,
  },

  creadoPor: {
    select: usuarioReadSelect,
  },

  firmas: {
    select: firmaReadSelect,

    orderBy: [
      {
        firmadoEn: 'asc' as const,
      },
      {
        id: 'asc' as const,
      },
    ],
  },

  enlaces: {
    select: enlaceReadSelect,

    orderBy: [
      {
        creadoEn: 'asc' as const,
      },
      {
        id: 'asc' as const,
      },
    ],
  },
} satisfies Prisma.TicketConformidadSelect;

/* --------------------------------------------------------- */

/**
 * Selección utilizada cuando consultamos directamente
 * una conformidad.
 */
const conformidadDetalleSelect = {
  ...conformidadCoreSelect,

  ticket: {
    select: ticketReadSelect,
  },
} satisfies Prisma.TicketConformidadSelect;

/* --------------------------------------------------------- */

/**
 * Selección utilizada para obtener todo el historial
 * partiendo del TicketSoporte.
 */
const ticketHistorialSelect = {
  ...ticketReadSelect,

  ticketsConformidad: {
    select: conformidadCoreSelect,

    orderBy: [
      {
        creadoEn: 'asc' as const,
      },
      {
        id: 'asc' as const,
      },
    ],
  },
} satisfies Prisma.TicketSoporteSelect;

/* =========================================================
 * PRISMA PAYLOAD TYPES
 * ======================================================= */

type UsuarioReadRecord = Prisma.UsuarioGetPayload<{
  select: typeof usuarioReadSelect;
}>;

type ClienteReadRecord = Prisma.ClienteInternetGetPayload<{
  select: typeof clienteReadSelect;
}>;

type MediaReadRecord = Prisma.MediaGetPayload<{
  select: typeof mediaReadSelect;
}>;

type TicketReadRecord = Prisma.TicketSoporteGetPayload<{
  select: typeof ticketReadSelect;
}>;

type FirmaReadRecord = Prisma.TicketFirmaGetPayload<{
  select: typeof firmaReadSelect;
}>;

type EnlaceReadRecord = Prisma.TicketConformidadEnlaceGetPayload<{
  select: typeof enlaceReadSelect;
}>;

type ConformidadCoreRecord = Prisma.TicketConformidadGetPayload<{
  select: typeof conformidadCoreSelect;
}>;

type ConformidadDetalleRecord = Prisma.TicketConformidadGetPayload<{
  select: typeof conformidadDetalleSelect;
}>;

type TicketHistorialRecord = Prisma.TicketSoporteGetPayload<{
  select: typeof ticketHistorialSelect;
}>;

/* =========================================================
 * QUERY
 * ======================================================= */

@Injectable()
export class TicketConformidadPrismaQuery
  implements TicketConformidadQueryPort
{
  constructor(private readonly prisma: PrismaService) {}

  /* =======================================================
   * PUBLIC QUERIES
   * ===================================================== */

  async findDetalleById(
    conformidadId: number,
  ): Promise<TicketConformidadDetalleReadModel | null> {
    const record = await this.prisma.ticketConformidad.findUnique({
      where: {
        id: conformidadId,
      },

      select: conformidadDetalleSelect,
    });

    if (!record) {
      return null;
    }

    const now = new Date();

    return this.mapDetalle(record, now);
  }

  async findLatestDetalleByTicketId(
    ticketId: number,
  ): Promise<TicketConformidadDetalleReadModel | null> {
    const record = await this.prisma.ticketConformidad.findFirst({
      where: {
        ticketId,
      },

      select: conformidadDetalleSelect,

      orderBy: [
        {
          creadoEn: 'desc',
        },
        {
          id: 'desc',
        },
      ],
    });

    if (!record) {
      return null;
    }

    const now = new Date();

    return this.mapDetalle(record, now);
  }

  async findHistorialByTicketId(
    ticketId: number,
  ): Promise<TicketConformidadHistorialReadModel | null> {
    const record = await this.prisma.ticketSoporte.findUnique({
      where: {
        id: ticketId,
      },

      select: ticketHistorialSelect,
    });

    if (!record) {
      return null;
    }

    const now = new Date();

    return this.mapHistorial(record, now);
  }

  /* =======================================================
   * DETAIL MAPPING
   * ===================================================== */

  private mapDetalle(
    record: ConformidadDetalleRecord,
    now: Date,
  ): TicketConformidadDetalleReadModel {
    const ticket = this.mapTicket(record.ticket);

    return this.mapConformidadCore(record, ticket, now);
  }

  private mapConformidadCore(
    record: ConformidadCoreRecord,
    ticket: TicketConformidadTicketReadModel,
    now: Date,
  ): TicketConformidadDetalleReadModel {
    const firmas = record.firmas.map((firma) => this.mapFirma(firma));

    const enlaces = record.enlaces.map((enlace) => this.mapEnlace(enlace, now));

    const firmaCliente =
      firmas.find((firma) => firma.tipo === TicketFirmaTipo.CLIENTE) ?? null;

    const firmaTecnico =
      firmas.find((firma) => firma.tipo === TicketFirmaTipo.TECNICO) ?? null;

    const cantidadEnlacesUsados = enlaces.filter(
      (enlace) => enlace.estadoDerivado === 'USADO',
    ).length;

    const cantidadEnlacesExpirados = enlaces.filter(
      (enlace) => enlace.estadoDerivado === 'EXPIRADO',
    ).length;

    const cantidadEnlacesRevocados = enlaces.filter(
      (enlace) => enlace.estadoDerivado === 'REVOCADO',
    ).length;

    const cantidadEnlacesActivos = enlaces.filter(
      (enlace) => enlace.estadoDerivado === 'ACTIVO',
    ).length;

    const ultimoEnlace =
      enlaces.length > 0 ? enlaces[enlaces.length - 1] : null;

    const resultado = this.resultadoToDomain(record.resultado);

    return {
      id: record.id,

      ticketId: record.ticketId,

      clienteId: record.clienteId,
      tecnicoAsignadoId: record.tecnicoAsignadoId,
      creadoPorId: record.creadoPorId,

      resultado,

      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,
      respondidoEn: record.respondidoEn,

      ticket,

      cliente: this.mapCliente(record.cliente),

      tecnicoAsignado: this.mapUsuario(record.tecnicoAsignado),

      creadoPor: this.mapUsuario(record.creadoPor),

      firmas,

      enlaces,

      resumen: {
        tieneFirmaCliente: firmaCliente !== null,
        tieneFirmaTecnico: firmaTecnico !== null,

        firmaClienteEn: firmaCliente?.firmadoEn ?? null,
        firmaTecnicoEn: firmaTecnico?.firmadoEn ?? null,

        cantidadFirmas: firmas.length,

        cantidadEnlaces: enlaces.length,
        cantidadEnlacesUsados,
        cantidadEnlacesExpirados,
        cantidadEnlacesRevocados,
        cantidadEnlacesActivos,

        ultimoEnlaceCanal: ultimoEnlace?.canal ?? null,
        ultimoEnlaceCreadoEn: ultimoEnlace?.creadoEn ?? null,

        requiereRetrabajo:
          resultado === TicketConformidadResultado.REQUIERE_RETRABAJO,

        estaConforme: resultado === TicketConformidadResultado.CONFORME,

        estaPendiente: resultado === TicketConformidadResultado.PENDIENTE,

        tiempoRespuestaMinutos: this.calculateResponseMinutes(
          record.creadoEn,
          record.respondidoEn,
        ),
      },
    };
  }

  /* =======================================================
   * HISTORY MAPPING
   * ===================================================== */

  private mapHistorial(
    record: TicketHistorialRecord,
    now: Date,
  ): TicketConformidadHistorialReadModel {
    const ticket = this.mapTicket(record);

    const conformidades = record.ticketsConformidad.map((conformidad) =>
      this.mapConformidadCore(conformidad, ticket, now),
    );

    const totalConformes = conformidades.filter(
      (item) => item.resultado === TicketConformidadResultado.CONFORME,
    ).length;

    const totalRetrabajos = conformidades.filter(
      (item) =>
        item.resultado === TicketConformidadResultado.REQUIERE_RETRABAJO,
    ).length;

    const totalPendientes = conformidades.filter(
      (item) => item.resultado === TicketConformidadResultado.PENDIENTE,
    ).length;

    const totalFirmasCliente = conformidades.filter(
      (item) => item.resumen.tieneFirmaCliente,
    ).length;

    const totalFirmasTecnico = conformidades.filter(
      (item) => item.resumen.tieneFirmaTecnico,
    ).length;

    const totalEnlaces = conformidades.reduce(
      (total, item) => total + item.resumen.cantidadEnlaces,
      0,
    );

    const totalEnlacesUsados = conformidades.reduce(
      (total, item) => total + item.resumen.cantidadEnlacesUsados,
      0,
    );

    const totalEnlacesActivos = conformidades.reduce(
      (total, item) => total + item.resumen.cantidadEnlacesActivos,
      0,
    );

    const tiemposRespuesta = conformidades
      .map((item) => item.resumen.tiempoRespuestaMinutos)
      .filter((value): value is number => value !== null);

    const tiempoPromedioRespuestaMinutos =
      tiemposRespuesta.length > 0
        ? Math.round(
            tiemposRespuesta.reduce((total, value) => total + value, 0) /
              tiemposRespuesta.length,
          )
        : null;

    const primera = conformidades.length > 0 ? conformidades[0] : null;

    const ultima =
      conformidades.length > 0 ? conformidades[conformidades.length - 1] : null;

    const ultimaRespuestaEn = this.findLatestResponseDate(conformidades);

    return {
      ticket,

      conformidades,

      resumen: {
        totalSolicitudes: conformidades.length,

        totalConformes,
        totalRetrabajos,
        totalPendientes,

        totalFirmasCliente,
        totalFirmasTecnico,

        totalEnlaces,
        totalEnlacesUsados,
        totalEnlacesActivos,

        requirioRetrabajoAlgunaVez: totalRetrabajos > 0,

        resultadoActual: ultima?.resultado ?? null,

        primeraSolicitudEn: primera?.creadoEn ?? null,
        ultimaSolicitudEn: ultima?.creadoEn ?? null,
        ultimaRespuestaEn,

        tiempoPromedioRespuestaMinutos,
      },
    };
  }

  /* =======================================================
   * RELATION MAPPERS
   * ===================================================== */

  private mapUsuario(
    record: UsuarioReadRecord | null,
  ): TicketConformidadUsuarioReadModel | null {
    if (!record) {
      return null;
    }

    return {
      id: record.id,

      empresaId: record.empresaId,

      nombre: record.nombre,
      correo: record.correo,
      telefono: record.telefono,

      rol: String(record.rol),

      activo: record.activo,
    };
  }

  private mapCliente(
    record: ClienteReadRecord | null,
  ): TicketConformidadClienteReadModel | null {
    if (!record) {
      return null;
    }

    const nombreCompleto = [record.nombre, record.apellidos]
      .filter(
        (value): value is string =>
          typeof value === 'string' && value.trim().length > 0,
      )
      .join(' ')
      .trim();

    return {
      id: record.id,

      empresaId: record.empresaId,
      asesorId: record.asesorId,

      nombre: record.nombre,
      apellidos: record.apellidos,
      nombreCompleto,

      dpi: record.dpi,

      observaciones: record.observaciones,
      nota: record.nota,

      telefono: record.telefono,
      direccion: record.direccion,

      contactoReferenciaNombre: record.contactoReferenciaNombre,

      contactoReferenciaTelefono: record.contactoReferenciaTelefono,

      ssidRouter: record.ssidRouter,

      fechaInstalacion: record.fechaInstalacion,

      servicioInternetId: record.servicioInternetId,
      sectorId: record.sectorId,

      municipioId: record.municipioId,
      departamentoId: record.departamentoId,
      facturacionZonaId: record.facturacionZonaId,

      mikrotikRouterId: record.mikrotikRouterId,

      estadoCliente: String(record.estadoCliente),
      estadoCobranza: String(record.estadoCobranza),

      estadoServicioMikrotik: String(record.estadoServicioMikrotik),

      enviarRecordatorio: record.enviarRecordatorio,

      isEliminado: record.isEliminado,
      eliminadoEn: record.eliminadoEn,
      desinstaladoEn: record.desinstaladoEn,

      whatsappActivo: record.whatsappActivo,

      whatsappDesactivadoEn: record.whatsappDesactivadoEn,

      whatsappDesactivadoPorId: record.whatsappDesactivadoPorId,

      motivoWhatsappDesactivado: record.motivoWhatsappDesactivado,

      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,

      asesor: this.mapUsuario(record.asesor),
    };
  }

  private mapMedia(record: MediaReadRecord): TicketConformidadMediaReadModel {
    return {
      id: record.id,

      empresaId: record.empresaId,
      clienteId: record.clienteId,
      albumId: record.albumId,
      subidoPorId: record.subidoPorId,

      categoria: String(record.categoria),
      tipo: String(record.tipo),
      estado: String(record.estado),

      bucket: record.bucket,
      region: record.region,

      key: record.key,
      cdnUrl: record.cdnUrl,

      mimeType: record.mimeType,
      extension: record.extension,

      tamanioBytes:
        record.tamanioBytes !== null ? record.tamanioBytes.toString() : null,

      ancho: record.ancho,
      alto: record.alto,

      checksumSha256: record.checksumSha256,

      titulo: record.titulo,
      descripcion: record.descripcion,
      etiqueta: record.etiqueta,

      orden: record.orden,

      tomadoEn: record.tomadoEn,

      publico: record.publico,
      eliminadoEn: record.eliminadoEn,

      metadatos: record.metadatos,

      notas: record.notas,

      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,

      subidoPor: this.mapUsuario(record.subidoPor),
    };
  }

  private mapTicket(
    record: TicketReadRecord,
  ): TicketConformidadTicketReadModel {
    return {
      id: record.id,

      clienteId: record.clienteId,
      empresaId: record.empresaId,
      tecnicoId: record.tecnicoId,
      creadoPorId: record.creadoPorId,

      estado: String(record.estado),
      prioridad: String(record.prioridad),

      titulo: record.titulo,
      descripcion: record.descripcion,

      fechaApertura: record.fechaApertura,
      fechaAsignacion: record.fechaAsignacion,

      fechaInicioAtencion: record.fechaInicioAtencion,

      fechaResolucionTecnico: record.fechaResolucionTecnico,

      fechaCierre: record.fechaCierre,

      creadoEn: record.creadoEn,
      actualizadoEn: record.actualizadoEn,

      fijado: record.fijado,

      clienteActual: this.mapCliente(record.cliente),

      tecnicoActual: this.mapUsuario(record.tecnico),

      creadoPor: this.mapUsuario(record.creadoPor),
    };
  }

  private mapFirma(record: FirmaReadRecord): TicketConformidadFirmaReadModel {
    return {
      id: record.id,

      conformidadId: record.conformidadId,
      mediaId: record.mediaId,

      tipo: this.firmaTipoToDomain(record.tipo),

      usuarioFirmanteId: record.usuarioFirmanteId,

      nombreFirmante: record.nombreFirmante,
      telefonoFirmante: record.telefonoFirmante,

      origen: this.firmaOrigenToDomain(record.origen),

      ipOrigen: record.ipOrigen,
      userAgent: record.userAgent,

      firmadoEn: record.firmadoEn,

      usuarioFirmante: this.mapUsuario(record.usuarioFirmante),

      media: this.mapMedia(record.media),
    };
  }

  private mapEnlace(
    record: EnlaceReadRecord,
    now: Date,
  ): TicketConformidadEnlaceReadModel {
    return {
      id: record.id,

      conformidadId: record.conformidadId,

      canal: this.canalToDomain(record.canal),

      telefonoDestino: record.telefonoDestino,

      expiraEn: record.expiraEn,

      usadoEn: record.usadoEn,
      revocadoEn: record.revocadoEn,

      creadoPorId: record.creadoPorId,

      creadoEn: record.creadoEn,

      creadoPor: this.mapUsuario(record.creadoPor),

      estadoDerivado: this.resolveEnlaceEstado(record, now),
    };
  }

  /* =======================================================
   * DERIVED VALUES
   * ===================================================== */

  private resolveEnlaceEstado(
    record: EnlaceReadRecord,
    now: Date,
  ): TicketConformidadEnlaceEstadoReadModel {
    if (record.usadoEn !== null) {
      return 'USADO';
    }

    if (record.revocadoEn !== null) {
      return 'REVOCADO';
    }

    if (record.expiraEn.getTime() <= now.getTime()) {
      return 'EXPIRADO';
    }

    return 'ACTIVO';
  }

  private calculateResponseMinutes(
    creadoEn: Date,
    respondidoEn: Date | null,
  ): number | null {
    if (!respondidoEn) {
      return null;
    }

    const milliseconds = respondidoEn.getTime() - creadoEn.getTime();

    if (milliseconds <= 0) {
      return 0;
    }

    return Math.floor(milliseconds / 60_000);
  }

  private findLatestResponseDate(
    conformidades: TicketConformidadDetalleReadModel[],
  ): Date | null {
    let latest: Date | null = null;

    for (const conformidad of conformidades) {
      if (!conformidad.respondidoEn) {
        continue;
      }

      if (
        latest === null ||
        conformidad.respondidoEn.getTime() > latest.getTime()
      ) {
        latest = conformidad.respondidoEn;
      }
    }

    return latest;
  }

  /* =======================================================
   * ENUM MAPPERS
   * ===================================================== */

  private resultadoToDomain(
    value: PrismaTicketConformidadResultado,
  ): TicketConformidadResultado {
    switch (value) {
      case PrismaTicketConformidadResultado.PENDIENTE:
        return TicketConformidadResultado.PENDIENTE;

      case PrismaTicketConformidadResultado.CONFORME:
        return TicketConformidadResultado.CONFORME;

      case PrismaTicketConformidadResultado.REQUIERE_RETRABAJO:
        return TicketConformidadResultado.REQUIERE_RETRABAJO;

      default:
        throw new Error(
          `Resultado de conformidad no soportado: ${String(value)}`,
        );
    }
  }

  private firmaTipoToDomain(value: PrismaTicketFirmaTipo): TicketFirmaTipo {
    switch (value) {
      case PrismaTicketFirmaTipo.CLIENTE:
        return TicketFirmaTipo.CLIENTE;

      case PrismaTicketFirmaTipo.TECNICO:
        return TicketFirmaTipo.TECNICO;

      default:
        throw new Error(`Tipo de firma no soportado: ${String(value)}`);
    }
  }

  private firmaOrigenToDomain(
    value: PrismaTicketFirmaOrigen,
  ): TicketFirmaOrigen {
    switch (value) {
      case PrismaTicketFirmaOrigen.CRM:
        return TicketFirmaOrigen.CRM;

      case PrismaTicketFirmaOrigen.PUBLICO:
        return TicketFirmaOrigen.PUBLICO;

      default:
        throw new Error(`Origen de firma no soportado: ${String(value)}`);
    }
  }

  private canalToDomain(
    value: PrismaTicketConformidadCanal,
  ): TicketConformidadCanal {
    switch (value) {
      case PrismaTicketConformidadCanal.LINK:
        return TicketConformidadCanal.LINK;

      case PrismaTicketConformidadCanal.QR:
        return TicketConformidadCanal.QR;

      case PrismaTicketConformidadCanal.WHATSAPP:
        return TicketConformidadCanal.WHATSAPP;

      default:
        throw new Error(`Canal de conformidad no soportado: ${String(value)}`);
    }
  }
}
