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
  ValidateIf,
} from 'class-validator';
import { PrioridadTicket } from '../../domain/enums/prioridad-ticket.enum';

/** Campos que no admiten `null`: se omiten o llevan valor. */
const SiLlega = () => ValidateIf((_objeto, valor) => valor !== undefined);

/**
 * Solo cambia lo que llega. El estado no se edita aquí: se cambia con las
 * acciones del ticket.
 */
export class ActualizarTicketDto {
  @SiLlega()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  titulo?: string;

  /** `null` la vacía. */
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descripcion?: string | null;

  @SiLlega()
  @IsEnum(PrioridadTicket)
  prioridad?: PrioridadTicket;

  @SiLlega()
  @IsBoolean()
  fijado?: boolean;

  /** `null` quita el cliente. */
  @IsOptional()
  @IsInt()
  @Min(1)
  clienteId?: number | null;

  /** `null` quita al técnico principal. */
  @IsOptional()
  @IsInt()
  @Min(1)
  tecnicoId?: number | null;

  /** La lista completa de apoyos; `[]` los quita. */
  @SiLlega()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  apoyoIds?: number[];

  /** La lista completa de etiquetas; `[]` las quita. */
  @SiLlega()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  etiquetaIds?: number[];
}
