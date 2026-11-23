import { PartialType } from '@nestjs/swagger';
import { UploadArchivosDto } from './create-credito-cliente-expediente.dto';

export class UpdateCreditoClienteExpedienteDto extends PartialType(
  UploadArchivosDto,
) {}
