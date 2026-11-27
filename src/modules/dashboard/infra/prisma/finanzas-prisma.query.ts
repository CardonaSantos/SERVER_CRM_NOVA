import { Injectable } from '@nestjs/common';
import { EstadoCliente, StateFacturaInternet } from '@prisma/client';
import {
  fechaNegocioDe,
  rangoDiasNegocio,
} from 'src/common/reloj/fecha-negocio';
import { PrismaService } from 'src/prisma/prisma.service';
import { sumarDias, sumarMeses } from '../../domain/policies/calendario.policy';
import { FinanzasQueryPort } from '../../domain/ports/finanzas-query.port';
import {
  FacturaDelPeriodo,
  FacturaSinPagar,
  PagoRecibido,
} from '../../domain/read-models/finanzas.read-model';

const SIN_PAGAR = [
  StateFacturaInternet.PENDIENTE,
  StateFacturaInternet.VENCIDA,
  StateFacturaInternet.PARCIAL,
];

const saldo = {
  estadoFacturaInternet: true,
  montoPago: true,
  saldoPendiente: true,
};

@Injectable()
export class FinanzasPrismaQuery implements FinanzasQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findFacturasDeMeses(meses: string[]): Promise<FacturaDelPeriodo[]> {
    // `periodo` se guarda como `YYYYMM`: el mes en que vence la factura.
    const filas = await this.prisma.facturaInternet.findMany({
      where: {
        periodo: { in: meses.map((mes) => mes.replace('-', '')) },
        estadoFacturaInternet: { not: StateFacturaInternet.ANULADA },
      },
      select: { periodo: true, ...saldo },
    });

    return filas.map((f) => ({
      mes: `${f.periodo.slice(0, 4)}-${f.periodo.slice(4, 6)}`,
      pagada: f.estadoFacturaInternet === StateFacturaInternet.PAGADA,
      montoPago: f.montoPago,
      saldoPendiente: f.saldoPendiente,
    }));
  }

  async findPagosDeMeses(meses: string[]): Promise<PagoRecibido[]> {
    const desde = `${meses[0]}-01`;
    const hasta = sumarDias(sumarMeses(`${meses[meses.length - 1]}-01`, 1), -1);

    const filas = await this.prisma.pagoFacturaInternet.findMany({
      where: { fechaPago: rangoDiasNegocio(desde, hasta) },
      select: { fechaPago: true, metodoPago: true, montoPagado: true },
    });

    return filas.map((p) => ({
      mes: fechaNegocioDe(p.fechaPago).slice(0, 7),
      metodo: p.metodoPago,
      monto: p.montoPagado,
    }));
  }

  async findFacturasSinPagar(): Promise<FacturaSinPagar[]> {
    const filas = await this.prisma.facturaInternet.findMany({
      where: {
        estadoFacturaInternet: { in: SIN_PAGAR },
        cliente: { isEliminado: false },
      },
      select: {
        clienteId: true,
        fechaPagoEsperada: true,
        cliente: { select: { estadoCliente: true } },
        ...saldo,
      },
    });

    return filas.map((f) => ({
      clienteId: f.clienteId,
      clienteDesinstalado:
        f.cliente.estadoCliente === EstadoCliente.DESINSTALADO,
      vence: f.fechaPagoEsperada ? fechaNegocioDe(f.fechaPagoEsperada) : null,
      pagada: false,
      montoPago: f.montoPago,
      saldoPendiente: f.saldoPendiente,
    }));
  }
}
