// factura-manager.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as dayjs from 'dayjs';
import {
  ClienteInternet,
  FacturacionZona,
  FacturaInternet,
} from '@prisma/client';
import { calcularPeriodo } from '../Functions';
import { getEstadoCliente, PENDIENTES_ENUM } from '../utils';

/**
 * Servicio que injecta mis funciones recurrentes en otros servicios similares
 */
@Injectable()
export class FacturaManagerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea la factura del periodo o devuelve la existente.
   * @returns factura + indicador esNueva
   */
  async obtenerOcrearFactura(
    cliente: ClienteInternet,
    zona: FacturacionZona,
  ): Promise<{ factura: FacturaInternet; esNueva: boolean }> {
    const hoy = dayjs().tz('America/Guatemala');
    const periodo = calcularPeriodo(zona, hoy);

    /* 1) Buscar existente */
    const existente = await this.prisma.facturaInternet.findFirst({
      where: { clienteId: cliente.id, facturacionZonaId: zona.id, periodo },
    });
    if (existente) return { factura: existente, esNueva: false };

    /* 2) Chequear pagos adelantados */
    const adelantada = await this.prisma.facturaInternet.findFirst({
      where: {
        clienteId: cliente.id,
        facturacionZonaId: zona.id,
        periodo: { gt: periodo },
        estadoFacturaInternet: 'PAGADA',
      },
    });
    if (adelantada)
      throw new InternalServerErrorException('Cliente pagado adelantado');

    /* 3) Traer datos frescos del cliente + plan */
    const clienteDb = await this.prisma.clienteInternet.findUnique({
      where: { id: cliente.id },
      include: { servicioInternet: true },
    });
    if (!clienteDb?.servicioInternet)
      throw new InternalServerErrorException('Cliente sin plan');

    /* 4) Crear la factura */
    const fechaPago = dayjs(periodo + zona.diaPago.toString().padStart(2, '0'))
      .tz('America/Guatemala')
      .toDate();

    const factura = await this.prisma.facturaInternet.create({
      data: {
        periodo,
        fechaPagoEsperada: fechaPago,
        montoPago: clienteDb.servicioInternet.precio,
        saldoPendiente: clienteDb.servicioInternet.precio,
        estadoFacturaInternet: 'PENDIENTE',
        cliente: { connect: { id: cliente.id } },
        facturacionZona: { connect: { id: zona.id } },
        nombreClienteFactura:
          `${clienteDb.nombre} ${clienteDb.apellidos ?? ''}`.trim(),
        detalleFactura: `Pago mensual – ${clienteDb.servicioInternet.nombre}`,
        empresa: { connect: { id: zona.empresaId } },
      },
    });

    /* 5) Incrementar saldo solo una vez */
    await this.prisma.saldoCliente.update({
      where: { clienteId: factura.clienteId },
      data: { saldoPendiente: { increment: factura.montoPago } },
    });

    return { factura, esNueva: true };
  }

  async actualizarEstadoCliente(factura: FacturaInternet): Promise<void> {
    const pendientes = await this.prisma.facturaInternet.count({
      where: {
        clienteId: factura.clienteId,
        estadoFacturaInternet: { in: PENDIENTES_ENUM },
      },
    });

    await this.prisma.clienteInternet.update({
      where: { id: factura.clienteId },
      data: { estadoCliente: getEstadoCliente(pendientes) },
    });
  }
}
