import { PartialType } from '@nestjs/mapped-types';

import { EstadoTicketSoporte, PrioridadTicketSoporte } from '@prisma/client';

import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

import { CreateTicketsSoporteDto } from './create-tickets-soporte.dto';

export class UpdateTicketsSoporteDto extends PartialType(
  CreateTicketsSoporteDto,
) {
  // =====================================================
  // ETIQUETAS
  // =====================================================
  //
  // Contrato definitivo:
  //
  // tags: number[]
  //
  // Ejemplos:
  //
  // tags: [1, 3, 8]
  // tags: []
  //
  // Ya NO recibimos:
  //
  // tags: [
  //   { value: 3, label: 'Internet' }
  // ]
  //
  // La transformación de SelectOption -> number
  // pertenece al frontend.
  // =====================================================

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tags?: number[];

  // =====================================================
  // COMPATIBILIDAD DEL FORMULARIO ACTUAL
  // =====================================================

  @IsOptional()
  assignee?: {
    id: number;
    name: string;
    initials?: string;
    avatar?: string;
  } | null;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(EstadoTicketSoporte)
  status?: EstadoTicketSoporte;

  @IsOptional()
  @IsEnum(PrioridadTicketSoporte)
  priority?: PrioridadTicketSoporte;

  /**
   * Alias histórico de técnicos adicionales.
   *
   * El payload nuevo utiliza principalmente:
   *
   * tecnicosAdicionales: number[]
   *
   * pero mantenemos companios para compatibilidad
   * mientras terminamos el refactor del módulo.
   */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  companios?: number[];

  @IsOptional()
  @IsBoolean()
  fixed?: boolean;
}
