import { OmitType, PartialType } from '@nestjs/swagger';
import { CrearMetaTicketDto } from './crear-meta-ticket.dto';

/** El técnico no se puede cambiar. `titulo: null` quita el nombre. */
export class ActualizarMetaTicketDto extends PartialType(
  OmitType(CrearMetaTicketDto, ['tecnicoId'] as const),
) {}
