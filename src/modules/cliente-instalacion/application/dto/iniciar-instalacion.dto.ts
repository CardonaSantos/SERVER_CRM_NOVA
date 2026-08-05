import { IsDateString, IsOptional } from 'class-validator';

/**
 * Inicia el trabajo físico de una instalación.
 *
 * No ejecuta operaciones PPPoE ni solicita
 * reautenticación del técnico.
 */
export class IniciarInstalacionClienteDto {
  /**
   * Permite registrar una fecha concreta cuando
   * el inicio ocurrió unos minutos antes.
   *
   * Cuando no se envía, la entidad utiliza la
   * fecha actual.
   */
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;
}
