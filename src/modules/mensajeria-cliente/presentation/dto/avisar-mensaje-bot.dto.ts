import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AvisarMensajeBotDto {
  /** Id del mensaje de WhatsApp que el bot acaba de guardar. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  wamid: string;
}
