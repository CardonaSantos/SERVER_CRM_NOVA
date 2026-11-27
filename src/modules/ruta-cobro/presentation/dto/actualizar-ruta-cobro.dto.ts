import { PartialType } from '@nestjs/swagger';
import { IsEnum, ValidateIf } from 'class-validator';
import { EstadoRutaCobro } from '../../domain/enums/estado-ruta-cobro.enum';
import { CrearRutaCobroDto } from './crear-ruta-cobro.dto';

/**
 * Todos los campos son opcionales. `null` solo se acepta donde significa
 * "quitar" (cobrador y observaciones).
 */
export class ActualizarRutaCobroDto extends PartialType(CrearRutaCobroDto, {
  skipNullProperties: false,
}) {
  /** Estado de la ruta; permite reabrir una cerrada */
  @ValidateIf((_, valor) => valor !== undefined)
  @IsEnum(EstadoRutaCobro)
  estado?: EstadoRutaCobro;
}
