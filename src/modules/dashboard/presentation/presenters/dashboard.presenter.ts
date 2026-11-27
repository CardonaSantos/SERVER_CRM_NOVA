import { ZONA_HORARIA_NEGOCIO } from 'src/common/reloj/fecha-negocio';
import {
  ActividadTicketsReadModel,
  ConteoPorPrioridad,
} from '../../domain/read-models/actividad-tickets.read-model';
import { CobrosDashboardReadModel } from '../../domain/read-models/cobros.read-model';
import {
  InstalacionesHistoricasReadModel,
  InstalacionesMesReadModel,
} from '../../domain/read-models/instalaciones.read-model';
import {
  ActividadDiaTecnico,
  PanelTecnicoReadModel,
} from '../../domain/read-models/panel-tecnico.read-model';
import { ResumenDashboardReadModel } from '../../domain/read-models/resumen.read-model';
import { ActividadTicketsResponseDto } from '../dto/actividad-tickets-response.dto';
import { CobrosResponseDto } from '../dto/cobros-response.dto';
import {
  InstalacionesHistoricasResponseDto,
  InstalacionesMesResponseDto,
} from '../dto/instalaciones-response.dto';
import { PanelTecnicoResponseDto } from '../dto/panel-tecnico-response.dto';
import { ResumenResponseDto } from '../dto/resumen-response.dto';

export class DashboardPresenter {
  static resumen(m: ResumenDashboardReadModel): ResumenResponseDto {
    const { servicio, cobranza } = m.clientes;
    const f = m.facturacion;

    return {
      periodo: periodo(m.periodo),
      clientes: {
        resumen: {
          totalEnSistema: m.clientes.resumen.totalEnSistema,
          carteraActual: m.clientes.resumen.carteraActual,
        },
        servicio: {
          activos: servicio.activos,
          suspendidos: servicio.suspendidos,
          pendientesActivacion: servicio.pendientesActivacion,
          enInstalacion: servicio.enInstalacion,
          desinstalados: servicio.desinstalados,
        },
        cobranza: {
          alDia: cobranza.alDia,
          pagoPendiente: cobranza.pagoPendiente,
          atrasados: cobranza.atrasados,
          morosos: cobranza.morosos,
        },
      },
      facturacion: {
        facturasEmitidasMes: f.facturasEmitidasMes,
        facturasPagadasMes: f.facturasPagadasMes,
        montoFacturadoMes: f.montoFacturadoMes,
        montoCobradoMes: f.montoCobradoMes,
        montoPendienteMes: f.montoPendienteMes,
      },
    };
  }

  static instalacionesMes(
    m: InstalacionesMesReadModel,
  ): InstalacionesMesResponseDto {
    return {
      periodo: periodo(m.periodo),
      totales: {
        instalaciones: m.totales.instalaciones,
        desinstalaciones: m.totales.desinstalaciones,
        balance: m.totales.balance,
      },
      actividadDiaria: m.actividadDiaria.map((d) => ({
        fecha: d.fecha,
        instalaciones: d.instalaciones,
        desinstalaciones: d.desinstalaciones,
      })),
    };
  }

  static instalacionesHistoricas(
    m: InstalacionesHistoricasReadModel,
  ): InstalacionesHistoricasResponseDto {
    const t = m.totales;

    return {
      periodo: { ...periodo(m.periodo), meses: m.periodo.meses },
      totales: {
        instalaciones: t.instalaciones,
        desinstalaciones: t.desinstalaciones,
        balance: t.balance,
        promedioInstalacionesMes: t.promedioInstalacionesMes,
        promedioDesinstalacionesMes: t.promedioDesinstalacionesMes,
      },
      actividadMensual: m.actividadMensual.map((a) => ({
        mes: a.mes,
        instalaciones: a.instalaciones,
        desinstalaciones: a.desinstalaciones,
        balance: a.balance,
      })),
    };
  }

  static actividadTickets(
    m: ActividadTicketsReadModel,
  ): ActividadTicketsResponseDto {
    const r = m.resumen;
    const c = m.comparativa;

    return {
      periodo: {
        ...periodo(m.periodo),
        preset: m.periodo.preset,
        granularidad: m.periodo.granularidad,
        puntos: m.periodo.puntos,
      },
      resumen: {
        creados: r.creados,
        resueltos: r.resueltos,
        pendientesActuales: r.pendientesActuales,
        urgentesPendientes: r.urgentesPendientes,
        altosPendientes: r.altosPendientes,
        pendientesMas48Horas: r.pendientesMas48Horas,
      },
      tiempos: {
        promedioResolucionMinutos: m.tiempos.promedioResolucionMinutos,
        promedioPrimeraAtencionMinutos:
          m.tiempos.promedioPrimeraAtencionMinutos,
      },
      prioridades: {
        creadosPeriodo: prioridades(m.prioridades.creadosPeriodo),
        resueltosPeriodo: prioridades(m.prioridades.resueltosPeriodo),
        pendientesActuales: prioridades(m.prioridades.pendientesActuales),
      },
      comparativa: c && {
        periodoAnterior: {
          desde: c.periodoAnterior.desde,
          hasta: c.periodoAnterior.hasta,
        },
        creados: { ...c.creados },
        resueltos: { ...c.resueltos },
      },
      actividad: m.actividad.map((a) => ({
        periodo: a.periodo,
        creados: a.creados,
        resueltos: a.resueltos,
        prioridades: {
          creados: prioridades(a.prioridades.creados),
          resueltos: prioridades(a.prioridades.resueltos),
        },
      })),
    };
  }

  static cobros(m: CobrosDashboardReadModel): CobrosResponseDto {
    return {
      rutasActiva: m.rutasActiva.map((r) => ({
        id: r.id,
        nombreRuta: r.nombreRuta,
        cobrador: r.cobrador ?? 'Sin cobrador',
        totalClientes: r.totalClientes,
      })),
      morosoTop: m.morosoTop.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        cantidad: c.cantidad,
      })),
    };
  }

  static panelTecnico(m: PanelTecnicoReadModel): PanelTecnicoResponseDto {
    const carga = m.cargaActual;
    const p = m.productividadMes;
    const { diaMasProductivo, diaMenosProductivoConActividad } =
      m.resumenActividad;

    return {
      tecnico: {
        id: m.tecnico.id,
        nombre: m.tecnico.nombre,
        correo: m.tecnico.correo,
        rol: m.tecnico.rol,
        activo: m.tecnico.activo,
      },
      periodo: {
        inicioMes: m.periodo.inicioMes.toISOString(),
        finMes: m.periodo.finMes.toISOString(),
        diasTranscurridos: m.periodo.diasTranscurridos,
        zonaHoraria: ZONA_HORARIA_NEGOCIO,
      },
      cargaActual: {
        ticketsPendientes: carga.ticketsPendientes,
        ticketsListosParaTrabajar: carga.ticketsListosParaTrabajar,
        ticketsUrgentes: carga.ticketsUrgentes,
        ticketsConMas48Horas: carga.ticketsConMas48Horas,
        instalacionesPendientes: carga.instalacionesPendientes,
        instalacionesProgramadasHoy: carga.instalacionesProgramadasHoy,
        instalacionesAtrasadas: carga.instalacionesAtrasadas,
      },
      productividadMes: {
        ticketsResueltos: p.ticketsResueltos,
        instalacionesCompletadas: p.instalacionesCompletadas,
        trabajosCompletados: p.trabajosCompletados,
        diasConActividad: p.diasConActividad,
        promedioTicketsPorDia: p.promedioTicketsPorDia,
        ritmoSemanalTickets: p.ritmoSemanalTickets,
        promedioTrabajosPorDiaActivo: p.promedioTrabajosPorDiaActivo,
      },
      tiempos: {
        promedioResolucionTicketMinutos:
          m.tiempos.promedioResolucionTicketMinutos,
        promedioInstalacionMinutos: m.tiempos.promedioInstalacionMinutos,
      },
      resumenActividad: {
        diaMasProductivo: diaMasProductivo && dia(diaMasProductivo),
        diaMenosProductivoConActividad:
          diaMenosProductivoConActividad && dia(diaMenosProductivoConActividad),
      },
      actividadDiaria: m.actividadDiaria.map(dia),
    };
  }
}

function periodo(p: { desde: string; hasta: string }) {
  return {
    desde: p.desde,
    hasta: p.hasta,
    zonaHoraria: ZONA_HORARIA_NEGOCIO,
  };
}

function prioridades(c: ConteoPorPrioridad): ConteoPorPrioridad {
  return { BAJA: c.BAJA, MEDIA: c.MEDIA, ALTA: c.ALTA, URGENTE: c.URGENTE };
}

function dia(d: ActividadDiaTecnico): ActividadDiaTecnico {
  return {
    fecha: d.fecha,
    etiqueta: d.etiqueta,
    tickets: d.tickets,
    instalaciones: d.instalaciones,
    total: d.total,
  };
}
