import { IsString, Matches, MaxLength } from 'class-validator';

export class CrearPlantillaContratoDto {
  /** Nombre de la plantilla */
  @IsString()
  @Matches(/\S/, { message: 'nombre es obligatorio' })
  @MaxLength(150)
  nombre: string;

  /** Texto del contrato; admite variables `[nombre_de_variable]` */
  @IsString()
  @Matches(/\S/, { message: 'body es obligatorio' })
  @MaxLength(100_000)
  body: string;
}
