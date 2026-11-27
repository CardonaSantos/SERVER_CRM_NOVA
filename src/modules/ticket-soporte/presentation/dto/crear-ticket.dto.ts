import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PrioridadTicket } from '../../domain/enums/prioridad-ticket.enum';

export class CrearTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  titulo: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descripcion?: string | null;

  /** Sin cliente es un ticket general. */
  @IsOptional()
  @IsInt()
  @Min(1)
  clienteId?: number | null;

  /** Por defecto MEDIA. */
  @IsOptional()
  @IsEnum(PrioridadTicket)
  prioridad?: PrioridadTicket;

  /** Técnico principal. Solo la oficina asigna. */
  @IsOptional()
  @IsInt()
  @Min(1)
  tecnicoId?: number | null;

  /** Técnicos de apoyo. Solo la oficina asigna. */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  apoyoIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  etiquetaIds?: number[];

  /** Solo la oficina fija tickets. */
  @IsOptional()
  @IsBoolean()
  fijado?: boolean;

  /** Número extra que también recibe el aviso por WhatsApp. */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefonoTemporal?: string | null;
}
