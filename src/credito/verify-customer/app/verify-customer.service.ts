import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  VERIFY_CUSTOMER_REPOSITORY,
  verifyCustomerRepository,
} from '../domain/verify-customer.repo';
import { verifyClientDto } from '../dto/verify-customer.dto';
import { StateFacturaInternet } from '@prisma/client';
import { HistorialPago } from '../infraestructure/prisma-verify-customer.repo';

@Injectable()
export class VerifyCustomerService {
  private readonly logger = new Logger(VerifyCustomerService.name);

  constructor(
    @Inject(VERIFY_CUSTOMER_REPOSITORY)
    private readonly verifyRepo: verifyCustomerRepository,
  ) {}

  /**
   * Verificar que el cliente es válido para el crédito
   * @param dto
   * @returns
   */
  async verifyCustomer(id: number) {
    this.logger.log('El id es: ', id);
    return await this.verifyRepo.verifyCustomer(id);
  }

  /**
   * Verificar que el cliente es válido para el crédito
   * @param dto
   * @returns
   */
  async calculatePenality(
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
  ) {
    return await this.verifyRepo.calculatePunctuality(facturas);
  }

  /**
   * Verificar que el cliente es válido para el crédito
   * @param dto
   * @returns
   */
  async generarResultado(historial: HistorialPago[]) {
    return await this.verifyRepo.generarResultado(historial, false);
  }
}
