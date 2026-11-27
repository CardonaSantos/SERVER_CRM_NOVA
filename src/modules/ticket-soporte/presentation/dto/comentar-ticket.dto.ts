import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Se envía como `multipart/form-data` (con las imágenes en el campo
 * `imagenes`) o como JSON si solo lleva texto.
 */
export class ComentarTicketDto {
  /** Obligatorio si no hay imágenes. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  texto?: string;
}
