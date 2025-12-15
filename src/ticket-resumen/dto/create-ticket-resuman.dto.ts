// src/tickets/dto/create-ticket-resumen.dto.ts
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTicketResumenDto {
  @IsInt()
  @IsPositive()
  ticketId: number;

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
