import { PartialType } from '@nestjs/swagger';
import { CrearZonaFacturacionDto } from './crear-zona-facturacion.dto';

/**
 * Todos los campos son opcionales. `null` solo se acepta donde significa
 * "quitar" (día de corte y suspensión).
 */
export class ActualizarZonaFacturacionDto extends PartialType(
  CrearZonaFacturacionDto,
  { skipNullProperties: false },
) {}
