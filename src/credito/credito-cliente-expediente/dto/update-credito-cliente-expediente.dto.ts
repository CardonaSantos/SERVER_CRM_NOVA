import { PartialType } from '@nestjs/mapped-types';
import { UploadClienteArchivosDto } from './create-credito-cliente-expediente.dto';

export class UpdateCreditoClienteExpedienteDto extends PartialType(
  UploadClienteArchivosDto,
) {}
