import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const FECHA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export class CrearContratoClienteDto {
  /** Cliente del contrato */
  @IsInt()
  @Min(1)
  clienteId: number;

  /** Fecha programada de instalación (`YYYY-MM-DD`) */
  @IsOptional()
  @Matches(FECHA, {
    message: 'fechaInstalacionProgramada debe ser AAAA-MM-DD',
  })
  fechaInstalacionProgramada?: string;

  /** Fecha de pago (`YYYY-MM-DD`) */
  @IsOptional()
  @Matches(FECHA, { message: 'fechaPago debe ser AAAA-MM-DD' })
  fechaPago?: string;

  /** Costo de instalación */
  @IsOptional()
  @IsNumber()
  @Min(0)
  costoInstalacion?: number;

  /** Observaciones */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observaciones?: string;
}
