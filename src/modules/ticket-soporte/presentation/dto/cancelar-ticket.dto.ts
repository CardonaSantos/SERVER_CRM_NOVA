import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Recortar } from 'src/common/http/transformaciones-query';

export class CancelarTicketDto {
  /** Por qué se cancela; queda en el ticket y en su bitácora. */
  @Recortar()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  motivo: string;
}
