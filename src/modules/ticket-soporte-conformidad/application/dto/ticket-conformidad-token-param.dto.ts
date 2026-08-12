import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TicketConformidadTokenParamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  token: string;
}
