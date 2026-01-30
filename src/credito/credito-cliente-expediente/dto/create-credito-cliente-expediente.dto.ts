import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoArchivoCliente } from '@prisma/client';
import { ClienteReferenciaDto } from './dto-referencias.dto';

export class UploadClienteArchivosDto {
  @IsArray()
  @IsEnum(TipoArchivoCliente, { each: true })
  tipos: TipoArchivoCliente[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  descripciones?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClienteReferenciaDto)
  referencias?: ClienteReferenciaDto[];
}
// export class CreateCreditoClienteExpedienteDto {}
