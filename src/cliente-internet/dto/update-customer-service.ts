import { IsInt } from 'class-validator';

export class updateCustomerService {
  @IsInt()
  customerId: number;
  @IsInt()
  serviceId: number;
}
