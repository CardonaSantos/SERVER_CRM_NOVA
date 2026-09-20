import { ReporteCantidadPorCategoria } from './cliente-reporte-resumen';

export interface ClienteReporteDistribuciones {
  porPlan: Array<ReporteCantidadPorCategoria<string>>;

  porDepartamento: Array<ReporteCantidadPorCategoria<string>>;

  porMunicipio: Array<ReporteCantidadPorCategoria<string>>;

  porSector: Array<ReporteCantidadPorCategoria<string>>;

  calidadDatos: {
    total: number;

    conTelefono: number;
    sinTelefono: number;

    conDpi: number;
    sinDpi: number;

    conPlan: number;
    sinPlan: number;

    conUbicacion: number;
    sinUbicacion: number;

    conContactoReferencia: number;
    sinContactoReferencia: number;
  };
}
