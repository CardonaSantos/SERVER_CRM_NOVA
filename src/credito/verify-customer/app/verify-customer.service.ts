import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  VERIFY_CUSTOMER_REPOSITORY,
  verifyCustomerRepository,
} from '../domain/verify-customer.repo';
import { verifyClientDto } from '../dto/verify-customer.dto';

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
  async verifyCustomer(dto: verifyClientDto) {
    this.logger.log(`DTO recibido:\n${JSON.stringify(dto, null, 2)}`);
    return await this.verifyRepo.verifyCustomer(dto);
  }
}
