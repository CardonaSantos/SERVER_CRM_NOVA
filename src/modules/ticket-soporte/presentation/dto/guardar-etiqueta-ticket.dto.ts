import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Crear o renombrar una etiqueta. */
export class GuardarEtiquetaTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  nombre: string;
}
