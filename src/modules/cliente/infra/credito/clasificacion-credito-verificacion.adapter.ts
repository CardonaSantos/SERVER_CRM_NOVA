import { Injectable } from '@nestjs/common';
import { StateFacturaInternet } from '@prisma/client';
import { VerifyCustomerService } from 'src/credito/verify-customer/app/verify-customer.service';
import {
  ClasificacionCredito,
  ClasificacionCreditoPort,
} from '../../application/ports/clasificacion-credito.port';
import { FacturaHistorialReadModel } from '../../domain/read-models/cliente-listado.read-model';

/** Transitorio: usa el servicio de `credito` hasta que publique su fachada. */
@Injectable()
export class ClasificacionCreditoVerificacionAdapter
  implements ClasificacionCreditoPort
{
  constructor(private readonly verificacion: VerifyCustomerService) {}

  async clasificar(
    facturas: FacturaHistorialReadModel[],
  ): Promise<ClasificacionCredito> {
    const historial = await this.verificacion.calculatePenality(
      facturas.map((f) => ({
        id: f.id,
        creadoEn: f.creadoEn,
        fechaPagoEsperada: f.fechaPagoEsperada!,
        fechaPagada: f.fechaPagada!,
        estadoFacturaInternet: f.estado as StateFacturaInternet,
        pagos: f.pagos,
      })),
    );
    const { resumen } = await this.verificacion.generarResultado(historial);

    return resumen;
  }
}
