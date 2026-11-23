import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTagsTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;
}
