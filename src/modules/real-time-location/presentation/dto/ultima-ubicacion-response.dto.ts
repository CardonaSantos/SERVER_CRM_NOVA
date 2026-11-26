export class UltimaUbicacionUsuarioResponseDto {
  nombre: string;
  rol: string;
  telefono: string | null;
  avatarUrl: string | null;
}

export class UltimaUbicacionTicketResponseDto {
  id: number;
  titulo: string | null;
}

export class UltimaUbicacionResponseDto {
  usuarioId: number;
  latitud: number;
  longitud: number;
  precision: number | null;
  velocidad: number | null;

  /** Porcentaje, 0 a 100. */
  bateria: number | null;

  /** ISO 8601. */
  actualizadoEn: string;

  usuario: UltimaUbicacionUsuarioResponseDto;
  ticketsEnProceso: UltimaUbicacionTicketResponseDto[];
}
