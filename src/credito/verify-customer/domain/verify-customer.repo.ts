import { verifyClientDto } from '../dto/verify-customer.dto';

export const VERIFY_CUSTOMER_REPOSITORY = Symbol('VERIFY_CUSTOMER_REPOSITORY');

export interface verifyCustomerRepository {
  verifyCustomer(id: number);
}
