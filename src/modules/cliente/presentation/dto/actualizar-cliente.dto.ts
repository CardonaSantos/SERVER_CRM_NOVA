import { OmitType, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  EstadoClientePersistido,
  EstadoOperativoCliente,
  EstadoOperativoLegacy,
} from '../../domain/enums/estado-operativo-cliente.enum';
import { CrearClienteDto } from './crear-cliente.dto';

const ESTADOS = [
  ...Object.values(EstadoOperativoCliente),
  ...Object.values(EstadoOperativoLegacy),
];

/** Edición de un cliente: lo que no llega no se modifica. */
export class ActualizarClienteDto extends PartialType(
  OmitType(CrearClienteDto, [
    'nombre',
    'estado',
    'ip',
    'gateway',
    'mascara',
    'mkSelected',
  ] as const),
) {
  /** Nombres del cliente */
  @IsString()
  @IsNotEmpty()
  nombre: string;

  /** Estado operativo; los valores antiguos solo se aceptan si no cambian */
  @IsOptional()
  @IsIn(ESTADOS)
  estado?: EstadoClientePersistido;

  /** Recibir recordatorios de pago */
  @IsOptional()
  @IsBoolean()
  enviarRecordatorio?: boolean;

  /** Router asignado; `null` lo desvincula */
  @IsOptional()
  @IsInt()
  mikrotikRouterId?: number | null;
}
