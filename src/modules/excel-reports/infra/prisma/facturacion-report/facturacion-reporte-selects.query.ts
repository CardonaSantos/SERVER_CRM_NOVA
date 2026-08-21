import { Prisma } from '@prisma/client';

// =====================================================
// FACTURA
// =====================================================

export const selectFacturaInternetReport =
  Prisma.validator<Prisma.FacturaInternetSelect>()({
    id: true,

    periodo: true,

    fechaPagoEsperada: true,

    fechaPagada: true,

    montoPago: true,

    saldoPendiente: true,

    estadoFacturaInternet: true,

    detalleFactura: true,

    nombreClienteFactura: true,

    creadoEn: true,

    actualizadoEn: true,

    // ===================================================
    // CLIENTE
    // ===================================================

    clienteId: true,

    cliente: {
      select: {
        id: true,

        nombre: true,

        apellidos: true,
      },
    },

    // ===================================================
    // ZONA
    // ===================================================

    facturacionZonaId: true,

    facturacionZona: {
      select: {
        id: true,

        nombre: true,
      },
    },

    // ===================================================
    // CREADOR
    // ===================================================

    creadorId: true,

    creador: {
      select: {
        id: true,

        nombre: true,
      },
    },
  });

export type FacturaReportePrismaResult = Prisma.FacturaInternetGetPayload<{
  select: typeof selectFacturaInternetReport;
}>;

// =====================================================
// PAGO
// =====================================================

export const selectPagoFacturaInternetReport =
  Prisma.validator<Prisma.PagoFacturaInternetSelect>()({
    id: true,

    facturaInternetId: true,

    clienteId: true,

    montoPagado: true,

    metodoPago: true,

    fechaPago: true,

    creadoEn: true,

    cobradorId: true,

    numeroBoleta: true,

    codigoConfirmacion: true,

    facturaRutaId: true,

    origen: true,

    // ===================================================
    // CLIENTE
    // ===================================================

    cliente: {
      select: {
        id: true,

        nombre: true,

        apellidos: true,
      },
    },

    // ===================================================
    // COBRADOR
    // ===================================================

    cobrador: {
      select: {
        id: true,

        nombre: true,
      },
    },

    // ===================================================
    // FACTURA
    // ===================================================

    facturaInternet: {
      select: {
        id: true,

        periodo: true,

        facturacionZonaId: true,

        facturacionZona: {
          select: {
            id: true,

            nombre: true,
          },
        },
      },
    },

    // ===================================================
    // RUTA DEL PAGO
    // ===================================================

    facturaRuta: {
      select: {
        id: true,

        rutaId: true,

        ruta: {
          select: {
            id: true,

            nombreRuta: true,
          },
        },
      },
    },
  });

export type PagoReportePrismaResult = Prisma.PagoFacturaInternetGetPayload<{
  select: typeof selectPagoFacturaInternetReport;
}>;

// =====================================================
// CLIENTE PARA PROYECCIÓN
// =====================================================

export const selectClienteFacturacionProyeccionReport =
  Prisma.validator<Prisma.ClienteInternetSelect>()({
    id: true,

    nombre: true,

    apellidos: true,

    servicioInternetId: true,

    facturacionZonaId: true,

    servicioInternet: {
      select: {
        id: true,

        nombre: true,

        precio: true,
      },
    },

    facturacionZona: {
      select: {
        id: true,

        nombre: true,

        diaGeneracionFactura: true,

        diaPago: true,
      },
    },
  });

export type FacturacionProyeccionClientePrismaResult =
  Prisma.ClienteInternetGetPayload<{
    select: typeof selectClienteFacturacionProyeccionReport;
  }>;
