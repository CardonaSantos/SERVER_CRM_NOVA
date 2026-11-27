import { ZONA_HORARIA_NEGOCIO } from 'src/common/reloj/fecha-negocio';
import {
  ClientesPorPlanReadModel,
  ClientesPorUbicacionReadModel,
} from '../../domain/read-models/cartera.read-model';
import {
  CobradoPorMetodoReadModel,
  DeudaAntiguedadReadModel,
  FacturacionMensualReadModel,
  MesFacturacion,
  ResumenDeuda,
} from '../../domain/read-models/finanzas.read-model';
import {
  ClientesPorPlanResponseDto,
  ClientesPorUbicacionResponseDto,
  CobradoPorMetodoResponseDto,
  DeudaAntiguedadResponseDto,
  FacturacionMensualResponseDto,
} from '../dto/graficas-response.dto';

export class GraficasPresenter {
  static facturacionMensual(
    m: FacturacionMensualReadModel,
  ): FacturacionMensualResponseDto {
    return {
      periodo: periodo(m.periodo),
      meses: m.meses.map((f) => ({ mes: f.mes, ...importes(f) })),
      totales: importes(m.totales),
    };
  }

  static cobradoPorMetodo(
    m: CobradoPorMetodoReadModel,
  ): CobradoPorMetodoResponseDto {
    return {
      periodo: periodo(m.periodo),
      metodos: m.metodos.map((x) => ({
        metodo: x.metodo,
        nombre: x.nombre,
        pagos: x.pagos,
        monto: x.monto,
      })),
      meses: m.meses.map((fila) => ({
        ...Object.fromEntries(
          m.metodos.map(({ metodo }) => [metodo, fila[metodo]]),
        ),
        mes: fila.mes,
      })),
      totales: { pagos: m.totales.pagos, monto: m.totales.monto },
    };
  }

  static deudaAntiguedad(
    m: DeudaAntiguedadReadModel,
  ): DeudaAntiguedadResponseDto {
    return {
      corte: m.corte,
      tramos: m.tramos.map((t) => ({
        tramo: t.tramo,
        nombre: t.nombre,
        ...deuda(t),
      })),
      totales: { ...deuda(m.totales), vencido: m.totales.vencido },
      desinstalados: deuda(m.desinstalados),
    };
  }

  static clientesPorPlan(
    m: ClientesPorPlanReadModel,
  ): ClientesPorPlanResponseDto {
    const sin = m.activosSinFacturar;

    return {
      planes: m.planes.map((p) => ({
        planId: p.planId,
        nombre: p.nombre,
        precio: p.precio,
        clientesFacturables: p.clientesFacturables,
        clientesSuspendidos: p.clientesSuspendidos,
        ingresoMensualEsperado: p.ingresoMensualEsperado,
      })),
      activosSinFacturar: {
        sinPlan: sin.sinPlan,
        sinZona: sin.sinZona,
        conFechaDeDesinstalacion: sin.conFechaDeDesinstalacion,
      },
      totales: {
        clientesFacturables: m.totales.clientesFacturables,
        clientesSuspendidos: m.totales.clientesSuspendidos,
        ingresoMensualEsperado: m.totales.ingresoMensualEsperado,
      },
    };
  }

  static clientesPorUbicacion(
    m: ClientesPorUbicacionReadModel,
  ): ClientesPorUbicacionResponseDto {
    return {
      agrupar: m.agrupar,
      corte: m.corte,
      grupos: m.grupos.map((g) => ({
        id: g.id,
        nombre: g.nombre,
        clientes: g.clientes,
        clientesConDeudaVencida: g.clientesConDeudaVencida,
        deuda: g.deuda,
        deudaVencida: g.deudaVencida,
      })),
      totales: {
        clientes: m.totales.clientes,
        clientesConDeudaVencida: m.totales.clientesConDeudaVencida,
        deuda: m.totales.deuda,
        deudaVencida: m.totales.deudaVencida,
      },
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

function importes(f: Omit<MesFacturacion, 'mes'>) {
  return {
    facturas: f.facturas,
    facturado: f.facturado,
    pagado: f.pagado,
    pendiente: f.pendiente,
    cobrado: f.cobrado,
    pagos: f.pagos,
  };
}

function deuda(d: ResumenDeuda) {
  return { facturas: d.facturas, clientes: d.clientes, monto: d.monto };
}
