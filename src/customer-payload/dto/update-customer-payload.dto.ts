import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerPayloadDto } from './create-customer-payload.dto';

export class UpdateCustomerPayloadDto extends PartialType(CreateCustomerPayloadDto) {}
