import { IsEnum, IsOptional, Matches } from 'class-validator';
import { PresetActividad } from '../../domain/enums/preset-actividad.enum';

const FECHA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export class ActividadTicketsQueryDto {
  /** Rango predefinido; por defecto 7 días */
  @IsOptional()
  @IsEnum(PresetActividad)
  preset?: PresetActividad;

  /** Inicio del rango personalizado (`YYYY-MM-DD`) */
  @IsOptional()
  @Matches(FECHA, { message: 'desde debe ser AAAA-MM-DD' })
  desde?: string;

  /** Fin del rango personalizado, incluido (`YYYY-MM-DD`) */
  @IsOptional()
  @Matches(FECHA, { message: 'hasta debe ser AAAA-MM-DD' })
  hasta?: string;
}
