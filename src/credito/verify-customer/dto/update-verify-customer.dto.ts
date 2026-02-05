import { PartialType } from '@nestjs/mapped-types';
import { CreateVerifyCustomerDto } from './create-verify-customer.dto';

export class UpdateVerifyCustomerDto extends PartialType(CreateVerifyCustomerDto) {}
