import { PartialType } from '@nestjs/swagger';
import { CreateVerifyCustomerDto } from './create-verify-customer.dto';

export class UpdateVerifyCustomerDto extends PartialType(CreateVerifyCustomerDto) {}
