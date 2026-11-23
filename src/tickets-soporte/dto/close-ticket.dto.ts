// close-ticket.dto.ts
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { UpdateTicketsSoporteDto } from './update-tickets-soporte.dto';

/**
 * PATCH /tickets-soporte/close-ticket-soporte (validadores: etapa 8,
 * alineado con CreateTicketResumenPayload del front). Los campos que el
 * front envía y el servicio todavía no usa se aceptan como opcionales para
 * que forbidNonWhitelisted no rechace el cierre.
 */
export class CloseTicketDto extends UpdateTicketsSoporteDto {
  @IsInt()
  @IsPositive()
  ticketId: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  usuarioId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  solucionId?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  resueltoComo?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notasInternas?: string | null;

  @IsOptional()
  @IsBoolean()
  reabierto?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  numeroReaperturas?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  intentos?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  tiempoTotalMinutos?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  tiempoTecnicoMinutos?: number | null;
}
