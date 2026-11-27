import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/** Un texto vacío significa "quitar el dato": llega como `null`. */
const VacioEsNulo = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || null : value,
  );

/** Valida solo si hay un valor que validar. */
const SiTieneValor = () =>
  ValidateIf((_, value) => value !== undefined && value !== null);

export class ActualizarEmpresaDto {
  /** Nombre comercial; no se puede vaciar */
  @ValidateIf((_, value) => value !== undefined)
  @VacioEsNulo()
  @IsString({ message: 'nombre es obligatorio' })
  @MaxLength(150)
  nombre?: string;

  /** Dirección */
  @VacioEsNulo()
  @SiTieneValor()
  @IsString()
  @MaxLength(255)
  direccion?: string | null;

  /** Teléfono */
  @VacioEsNulo()
  @SiTieneValor()
  @IsString()
  @MaxLength(50)
  telefono?: string | null;

  /** PBX */
  @VacioEsNulo()
  @SiTieneValor()
  @IsString()
  @MaxLength(50)
  pbx?: string | null;

  /** Correo de contacto */
  @VacioEsNulo()
  @SiTieneValor()
  @IsEmail()
  @MaxLength(255)
  correo?: string | null;

  /** Sitio web */
  @VacioEsNulo()
  @SiTieneValor()
  @IsUrl()
  @MaxLength(2048)
  sitioWeb?: string | null;

  /** NIT */
  @VacioEsNulo()
  @SiTieneValor()
  @IsString()
  @MaxLength(50)
  nit?: string | null;

  /** Dirección web del logo principal */
  @VacioEsNulo()
  @SiTieneValor()
  @IsUrl()
  @MaxLength(2048)
  logo1?: string | null;

  /** Dirección web del segundo logo */
  @VacioEsNulo()
  @SiTieneValor()
  @IsUrl()
  @MaxLength(2048)
  logo2?: string | null;

  /** Dirección web del tercer logo */
  @VacioEsNulo()
  @SiTieneValor()
  @IsUrl()
  @MaxLength(2048)
  logo3?: string | null;
}
