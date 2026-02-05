import { PartialType } from '@nestjs/mapped-types';
import { UploadArchivosDto } from './create-credito-cliente-expediente.dto';

export class UpdateCreditoClienteExpedienteDto extends PartialType(
  UploadArchivosDto,
) {}
