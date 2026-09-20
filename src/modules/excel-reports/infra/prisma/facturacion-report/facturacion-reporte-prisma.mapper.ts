import { InternalServerErrorException } from '@nestjs/common';

import {
  FacturacionReporteEstadoFactura,
  type FacturacionReporteEstadoFactura as FacturacionReporteEstadoFacturaType,
} from '../../../domain/enums/facturacion-report/facturacion-reporte-estado-factura.enum';

import {
  FacturacionReporteMetodoPago,
  type FacturacionReporteMetodoPago as FacturacionReporteMetodoPagoType,
} from '../../../domain/enums/facturacion-report/facturacion-reporte-metodo-pago.enum';

import {
  FacturacionReporteOrigenPago,
  type FacturacionReporteOrigenPago as FacturacionReporteOrigenPagoType,
} from '../../../domain/enums/facturacion-report/facturacion-reporte-origen-pago.enum';

import { FacturaReporteRow } from '../../../domain/read-models/facturacion-reporte/factura-reporte-row';

import { PagoReporteRow } from '../../../domain/read-models/facturacion-reporte/pago-reporte-row';

import { FacturacionProyeccionClienteRow } from '../../../domain/read-models/facturacion-reporte/facturacion-proyeccion-cliente-row';

import {
  FacturaReportePrismaResult,
  FacturacionProyeccionClientePrismaResult,
  PagoReportePrismaResult,
} from './facturacion-reporte-selects.query';

export class FacturacionReportePrismaMapper {
  // FACTURA

  static facturaToRow(factura: FacturaReportePrismaResult): FacturaReporteRow {
    const montoFactura = this.assertMoney(
      factura.montoPago,
      `FacturaInternet ${factura.id}.montoPago`,
    );

    const saldoPendiente = this.assertMoney(
      factura.saldoPendiente,
      `FacturaInternet ${factura.id}.saldoPendiente`,
    );

    if (saldoPendiente > montoFactura) {
      throw new InternalServerErrorException(
        `FacturaInternet ${factura.id}: saldoPendiente (${saldoPendiente}) supera montoPago (${montoFactura}).`,
      );
    }

    return {
      facturaId: factura.id,

      periodo: this.assertPeriodo(factura.periodo, factura.id),

      // CLIENTE

      clienteId: factura.clienteId,

      nombreClienteFactura: factura.nombreClienteFactura,

      clienteNombreActual: this.buildNombreCliente(
        factura.cliente.nombre,
        factura.cliente.apellidos,
      ),

      // ZONA

      facturacionZonaId: factura.facturacionZonaId,

      facturacionZonaNombre: factura.facturacionZona?.nombre ?? null,

      // CREADOR

      creadorId: factura.creadorId,

      creadorNombre: factura.creador?.nombre ?? null,

      // FACTURACIÓN

      fechaPagoEsperada: factura.fechaPagoEsperada,

      fechaPagada: factura.fechaPagada,

      montoFactura,

      saldoPendiente,

      estado: this.mapEstadoFactura(factura.estadoFacturaInternet),

      detalleFactura: factura.detalleFactura,

      // AUDITORÍA

      creadoEn: factura.creadoEn,

      actualizadoEn: factura.actualizadoEn,
    };
  }

  // PAGO

  static pagoToRow(pago: PagoReportePrismaResult): PagoReporteRow {
    const montoPagado = this.assertMoney(
      pago.montoPagado,
      `PagoFacturaInternet ${pago.id}.montoPagado`,
    );

    return {
      pagoId: pago.id,

      facturaInternetId: pago.facturaInternetId,

      facturaPeriodo: this.assertPeriodo(
        pago.facturaInternet.periodo,
        pago.facturaInternetId,
      ),

      // CLIENTE

      clienteId: pago.clienteId,

      clienteNombre: this.buildNombreCliente(
        pago.cliente.nombre,
        pago.cliente.apellidos,
      ),

      // PAGO

      montoPagado,

      metodoPago: this.mapMetodoPago(pago.metodoPago),

      origen: this.mapOrigenPago(pago.origen),

      fechaPago: pago.fechaPago,

      // COBRADOR

      cobradorId: pago.cobradorId,

      cobradorNombre: pago.cobrador?.nombre ?? null,

      // ZONA

      facturacionZonaId: pago.facturaInternet.facturacionZonaId,

      facturacionZonaNombre:
        pago.facturaInternet.facturacionZona?.nombre ?? null,

      // RUTA

      facturaRutaId: pago.facturaRutaId,

      rutaId: pago.facturaRuta?.ruta.id ?? null,

      rutaNombre: pago.facturaRuta?.ruta.nombreRuta ?? null,

      // COMPROBANTES

      numeroBoleta: pago.numeroBoleta,

      codigoConfirmacion: pago.codigoConfirmacion,

      // AUDITORÍA

      creadoEn: pago.creadoEn,
    };
  }

  // PROYECCIÓN

  static proyeccionClienteToRow(
    cliente: FacturacionProyeccionClientePrismaResult,
  ): FacturacionProyeccionClienteRow {
    if (!cliente.servicioInternetId || !cliente.servicioInternet) {
      throw new InternalServerErrorException(
        `ClienteInternet ${cliente.id}: no posee servicio de internet válido para proyección.`,
      );
    }

    if (!cliente.facturacionZonaId || !cliente.facturacionZona) {
      throw new InternalServerErrorException(
        `ClienteInternet ${cliente.id}: no posee zona de facturación válida para proyección.`,
      );
    }

    const precioMensual = this.assertMoney(
      cliente.servicioInternet.precio,
      `ServicioInternet ${cliente.servicioInternet.id}.precio`,
    );

    return {
      clienteId: cliente.id,

      clienteNombre: this.buildNombreCliente(cliente.nombre, cliente.apellidos),

      servicioInternetId: cliente.servicioInternet.id,

      servicioInternetNombre: cliente.servicioInternet.nombre,

      precioMensual,

      facturacionZonaId: cliente.facturacionZona.id,

      facturacionZonaNombre: cliente.facturacionZona.nombre,

      diaGeneracionFactura: this.assertDiaMes(
        cliente.facturacionZona.diaGeneracionFactura,
        `FacturacionZona ${cliente.facturacionZona.id}.diaGeneracionFactura`,
      ),

      diaPago: this.assertDiaMes(
        cliente.facturacionZona.diaPago,
        `FacturacionZona ${cliente.facturacionZona.id}.diaPago`,
      ),
    };
  }

  // MONEY

  private static assertMoney(
    value: number | null | undefined,
    field: string,
  ): number {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      throw new InternalServerErrorException(
        `${field}: valor monetario inválido o ausente.`,
      );
    }

    if (value < 0) {
      throw new InternalServerErrorException(
        `${field}: valor monetario negativo (${value}).`,
      );
    }

    /**
     * Los modelos actuales utilizan Float.
     *
     */
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  // PERIODO

  private static assertPeriodo(value: string, facturaId: number): string {
    if (!/^\d{6}$/.test(value)) {
      throw new InternalServerErrorException(
        `FacturaInternet ${facturaId}: periodo inválido "${value}". Se esperaba YYYYMM.`,
      );
    }

    const month = Number(value.slice(4, 6));

    if (month < 1 || month > 12) {
      throw new InternalServerErrorException(
        `FacturaInternet ${facturaId}: periodo inválido "${value}".`,
      );
    }

    return value;
  }

  // FECHAS CONFIGURADAS

  private static assertDiaMes(value: number, field: string): number {
    if (!Number.isInteger(value) || value < 1 || value > 31) {
      throw new InternalServerErrorException(
        `${field}: debe encontrarse entre 1 y 31.`,
      );
    }

    return value;
  }

  // CLIENTE

  private static buildNombreCliente(
    nombre: string,
    apellidos: string | null,
  ): string {
    return [nombre, apellidos]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(' ')
      .trim();
  }

  // ENUMS

  private static mapEstadoFactura(
    value: string,
  ): FacturacionReporteEstadoFacturaType {
    const values = Object.values(FacturacionReporteEstadoFactura) as string[];

    if (!values.includes(value)) {
      throw new InternalServerErrorException(
        `Estado de factura no soportado por el reporte: ${value}.`,
      );
    }

    return value as FacturacionReporteEstadoFacturaType;
  }

  private static mapMetodoPago(
    value: string,
  ): FacturacionReporteMetodoPagoType {
    const values = Object.values(FacturacionReporteMetodoPago) as string[];

    if (!values.includes(value)) {
      throw new InternalServerErrorException(
        `Método de pago no soportado por el reporte: ${value}.`,
      );
    }

    return value as FacturacionReporteMetodoPagoType;
  }

  private static mapOrigenPago(
    value: string,
  ): FacturacionReporteOrigenPagoType {
    const values = Object.values(FacturacionReporteOrigenPago) as string[];

    if (!values.includes(value)) {
      throw new InternalServerErrorException(
        `Origen de pago no soportado por el reporte: ${value}.`,
      );
    }

    return value as FacturacionReporteOrigenPagoType;
  }
}
