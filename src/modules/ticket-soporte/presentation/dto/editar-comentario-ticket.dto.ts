import { IsString, MaxLength } from 'class-validator';

export class EditarComentarioTicketDto {
  /** El texto completo; vacío solo si el comentario tiene imágenes. */
  @IsString()
  @MaxLength(2000)
  texto: string;
}
