import { PartialType } from '@nestjs/mapped-types';
import { CreateClienteInternetDto } from './create-cliente-internet.dto';

export class UpdateClienteInternetDto extends PartialType(CreateClienteInternetDto) {}
