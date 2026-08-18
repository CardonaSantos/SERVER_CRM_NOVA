import { ClienteReporteRow } from 'src/modules/excel-reports/domain/read-models/cliente-reportes/cliente-reporte-row';
import { ClienteReportePrismaResult } from './cliente-reporte-selects.query';

export class ClienteReportePrismaMapper {
  static toRow(cliente: ClienteReportePrismaResult): ClienteReporteRow {
    const nombreCompleto = [cliente.nombre, cliente.apellidos]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(' ')
      .trim();

    return {
      id: cliente.id,

      nombre: cliente.nombre,
      apellidos: cliente.apellidos,
      nombreCompleto,

      dpi: cliente.dpi,

      telefono: cliente.telefono,

      contactoReferenciaNombre: cliente.contactoReferenciaNombre,

      contactoReferenciaTelefono: cliente.contactoReferenciaTelefono,

      estadoCliente: cliente.estadoCliente,

      estadoCobranza: cliente.estadoCobranza,

      plan: cliente.servicioInternet?.nombre ?? null,

      fechaInstalacion: cliente.fechaInstalacion,

      sector: cliente.sector?.nombre ?? null,

      municipio: cliente.municipio?.nombre ?? null,

      departamento: cliente.departamento?.nombre ?? null,

      direccion: cliente.direccion,

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
}
