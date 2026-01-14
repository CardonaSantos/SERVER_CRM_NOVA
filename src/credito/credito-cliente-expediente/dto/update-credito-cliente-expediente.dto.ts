import { PartialType } from '@nestjs/mapped-types';
import { CreateCreditoClienteExpedienteDto } from './create-credito-cliente-expediente.dto';

export class UpdateCreditoClienteExpedienteDto extends PartialType(CreateCreditoClienteExpedienteDto) {}
