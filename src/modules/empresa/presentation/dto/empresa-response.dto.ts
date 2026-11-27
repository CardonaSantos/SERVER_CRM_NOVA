export class EmpresaResumenResponseDto {
  /** Id de la empresa */
  id: number;
  /** Nombre */
  nombre: string;
  /** Logo principal */
  logo1: string | null;
}

export class EmpresaResponseDto extends EmpresaResumenResponseDto {
  /** Dirección */
  direccion: string | null;
  /** Teléfono */
  telefono: string | null;
  /** PBX */
  pbx: string | null;
  /** Correo de contacto */
  correo: string | null;
  /** Sitio web */
  sitioWeb: string | null;
  /** NIT */
  nit: string | null;
  /** Segundo logo */
  logo2: string | null;
  /** Tercer logo */
  logo3: string | null;
  /** ISO 8601 */
  actualizadaEn: string;
}
