import { Inject, Injectable } from '@nestjs/common';
import { CreateVerifyCustomerDto } from '../dto/create-verify-customer.dto';
import { UpdateVerifyCustomerDto } from '../dto/update-verify-customer.dto';
import { PrismaVerifyCustomerRepository } from '../infraestructure/prisma-verify-customer.repo';
import { VERIFY_CUSTOMER_REPOSITORY } from '../domain/verify-customer.repo';
import { verifyClientDto } from '../dto/verify-customer.dto';

@Injectable()
export class VerifyCustomerService {
  constructor(
    @Inject(VERIFY_CUSTOMER_REPOSITORY)
    private readonly verifyRepo: PrismaVerifyCustomerRepository,
  ) {}

  /**
   * Verificar que el cliente es válido para el crédito
   * @param dto
   * @returns
   */
  async verifyCustomer(dto: verifyClientDto) {
    return await this.verifyRepo.verifyCustomer(dto);
  }
}
