import { PartialType } from '@nestjs/swagger';
import { CreateCustomerPayloadDto } from './create-customer-payload.dto';

export class UpdateCustomerPayloadDto extends PartialType(CreateCustomerPayloadDto) {}
