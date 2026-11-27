import { ResumenMetricasResult } from '../../application/use-cases/obtener-resumen-metricas.use-case';
import { ResueltosPorDiaResult } from '../../application/use-cases/obtener-resueltos-por-dia.use-case';
import {
  ResueltosPorDiaResponseDto,
  ResumenMetricasResponseDto,
} from '../dto/metrica-ticket-response.dto';
import { MetaTicketPresenter } from './meta-ticket.presenter';

export class MetricaTicketPresenter {
  static resumen(r: ResumenMetricasResult): ResumenMetricasResponseDto {
    return {
      mes: r.mes,
      desde: r.desde,
      hasta: r.hasta,
      diasTotales: r.diasTotales,
      diasTranscurridos: r.diasTranscurridos,
      resueltosDelMes: r.resueltosDelMes,
      ahora: {
        activos: r.ahora.activos,
        enProceso: r.ahora.enProceso,
        resueltosHoy: r.ahora.resueltosHoy,
        asignadosHoy: r.ahora.asignadosHoy,
      },
      tecnicos: r.tecnicos.map((t) => ({
        tecnico: MetaTicketPresenter.tecnico(t.tecnico),
        totalTickets: t.totalTickets,
        resueltos: t.resueltos,
        pendientes: t.pendientes,
        tasaResolucion: t.tasaResolucion,
        horasPromedio: t.horasPromedio,
        resueltosPorDia: t.resueltosPorDia,
        proyeccion: t.proyeccion,
      })),
    };
  }

  static porDia(r: ResueltosPorDiaResult): ResueltosPorDiaResponseDto {
    return {
      mes: r.mes,
      tecnicos: r.tecnicos.map((t) => MetaTicketPresenter.tecnico(t)),
      dias: r.dias.map((d) => ({
        fecha: d.fecha,
        total: d.total,
        porTecnico: d.porTecnico.map((p) => ({
          tecnicoId: p.tecnicoId,
          resueltos: p.resueltos,
        })),
      })),
    };
  }
}
