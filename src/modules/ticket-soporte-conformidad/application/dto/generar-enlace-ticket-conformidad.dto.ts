import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TicketConformidadCanal } from '../../domain/enums/ticket-conformidad-canal.enum';

export class GenerarEnlaceTicketConformidadDto {
  @IsEnum(TicketConformidadCanal)
  canal: TicketConformidadCanal;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefonoDestino?: string;
}
