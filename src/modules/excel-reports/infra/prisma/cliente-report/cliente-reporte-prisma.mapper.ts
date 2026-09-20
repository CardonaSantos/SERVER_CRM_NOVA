import { ClienteReporteRow } from 'src/modules/excel-reports/domain/read-models/cliente-reportes/cliente-reporte-row';
import { ClienteReportePrismaResult } from './cliente-reporte-selects.query';

export class ClienteReportePrismaMapper {
  static toRow(cliente: ClienteReportePrismaResult): ClienteReporteRow {
    const nombreCompleto = [cliente.nombre, cliente.apellidos]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(' ')
      .trim();

    const latitud = cliente.ubicacion?.latitud ?? null;

    const longitud = cliente.ubicacion?.longitud ?? null;

    const ubicacionMapsUrl =
      latitud !== null && longitud !== null
        ? `https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`
        : null;

    return {
      id: cliente.id,

      nombre: cliente.nombre,
      apellidos: cliente.apellidos,
      nombreCompleto,

      dpi: cliente.dpi,

      telefono: this.normalizePhone(cliente.telefono),

      contactoReferenciaTelefono: this.normalizePhone(
        cliente.contactoReferenciaTelefono,
      ),

      contactoReferenciaNombre: cliente.contactoReferenciaNombre,

      estadoCliente: cliente.estadoCliente,

      estadoCobranza: cliente.estadoCobranza,

      plan: cliente.servicioInternet?.nombre ?? null,

      fechaInstalacion: cliente.fechaInstalacion,

      sector: cliente.sector?.nombre ?? null,

      municipio: cliente.municipio?.nombre ?? null,

      departamento: cliente.departamento?.nombre ?? null,

      direccion: cliente.direccion,

      latitud,
      longitud,
      ubicacionMapsUrl,

      observaciones: cliente.observaciones,

      nota: cliente.nota,

      totalTickets: cliente._count.ticketSoporte,

      totalInstalaciones: cliente._count.instalaciones,

      totalDesinstalaciones: cliente._count.desinstalaciones,

      isEliminado: cliente.isEliminado,

      desinstaladoEn: cliente.desinstaladoEn,

      creadoEn: cliente.creadoEn,

      actualizadoEn: cliente.actualizadoEn,
    };
  }

  private static normalizePhone(value: string | null): string | null {
    const normalized = value?.trim();

    if (!normalized) {
      return null;
    }

    /**
     * Corrige únicamente valores legacy como:
     * "30817715.0" -> "30817715"
     *
     * No modifica:
     * "+502 3081-7715"
     * "030817715"
     */
    if (/^\d+\.0$/.test(normalized)) {
      return normalized.slice(0, -2);
    }

    return normalized;
  }
}
