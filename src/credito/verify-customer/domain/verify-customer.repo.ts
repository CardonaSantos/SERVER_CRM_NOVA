import { StateFacturaInternet } from '@prisma/client';
import { verifyClientDto } from '../dto/verify-customer.dto';
import { HistorialPago } from '../infraestructure/prisma-verify-customer.repo';

export const VERIFY_CUSTOMER_REPOSITORY = Symbol('VERIFY_CUSTOMER_REPOSITORY');

export interface verifyCustomerRepository {
  verifyCustomer(id: number);

  calculatePunctuality(
    facturas: {
      id: number;
      creadoEn: Date;
      fechaPagoEsperada: Date;
      fechaPagada: Date;
      estadoFacturaInternet: StateFacturaInternet;
      pagos: {
        id: number;
        montoPagado: number;
        fechaPago: Date;
      }[];
    }[],
  );

  generarResultado(
    historial: HistorialPago[],
    includeHistorial?: boolean,
  ): Promise<{
    historial: HistorialPago[];
    resumen: {
      puntualidadPct: number;
      promedioAtraso: number;
      medianaAtraso: number;
      rachaActual: number;
      score: number;
      clasificacion: string;
    };
  }>;
}
