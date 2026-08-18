import { ClienteReporteDistribuciones } from '../../domain/read-models/cliente-reportes/cliente-reporte-distribuciones';
import { ClienteReporteRow } from '../../domain/read-models/cliente-reportes/cliente-reporte-row';
import { ReporteCantidadPorCategoria } from '../../domain/read-models/cliente-reportes/cliente-reporte-resumen';

export class ClienteReporteDistribucionesBuilder {
  static build(clientes: ClienteReporteRow[]): ClienteReporteDistribuciones {
    return {
      porPlan: this.groupBy(clientes, (cliente) => cliente.plan),

      porDepartamento: this.groupBy(
        clientes,
        (cliente) => cliente.departamento,
      ),

      porMunicipio: this.groupBy(clientes, (cliente) => cliente.municipio),

      porSector: this.groupBy(clientes, (cliente) => cliente.sector),

      calidadDatos: {
        total: clientes.length,

        conTelefono: clientes.filter((cliente) =>
          Boolean(cliente.telefono?.trim()),
        ).length,

        sinTelefono: clientes.filter((cliente) => !cliente.telefono?.trim())
          .length,

        conDpi: clientes.filter((cliente) => Boolean(cliente.dpi?.trim()))
          .length,

        sinDpi: clientes.filter((cliente) => !cliente.dpi?.trim()).length,

        conPlan: clientes.filter((cliente) => Boolean(cliente.plan?.trim()))
          .length,

        sinPlan: clientes.filter((cliente) => !cliente.plan?.trim()).length,

        conUbicacion: clientes.filter((cliente) =>
          Boolean(cliente.ubicacionMapsUrl),
        ).length,

        sinUbicacion: clientes.filter((cliente) => !cliente.ubicacionMapsUrl)
          .length,

        conContactoReferencia: clientes.filter(
          (cliente) =>
            Boolean(cliente.contactoReferenciaNombre?.trim()) ||
            Boolean(cliente.contactoReferenciaTelefono?.trim()),
        ).length,

        sinContactoReferencia: clientes.filter(
          (cliente) =>
            !cliente.contactoReferenciaNombre?.trim() &&
            !cliente.contactoReferenciaTelefono?.trim(),
        ).length,
      },
    };
  }

  private static groupBy(
    clientes: ClienteReporteRow[],
    selector: (cliente: ClienteReporteRow) => string | null,
  ): Array<ReporteCantidadPorCategoria<string>> {
    const counters = new Map<string, number>();

    for (const cliente of clientes) {
      const categoria = selector(cliente)?.trim() || 'Sin asignar';

      counters.set(categoria, (counters.get(categoria) ?? 0) + 1);
    }

    return Array.from(counters.entries())
      .map(([categoria, total]) => ({
        categoria,
        total,
      }))
      .sort((a, b) => b.total - a.total);
  }
}
