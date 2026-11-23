import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Ticket creado por el bot externo (POST /crm-bot-functions/create-ticket). */
export class CreateBotFunctionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  titulo: string;

  @IsString()
  @MaxLength(5000)
  descripcion: string;
}
