/** Posición actual de un usuario, con los datos que pinta el mapa. */
export type UltimaUbicacionReadModel = {
  usuarioId: number;

  latitud: number;
  longitud: number;

  precision: number | null;
  velocidad: number | null;
  bateria: number | null;

  actualizadoEn: Date;

  usuario: {
    nombre: string;
    rol: string;
    telefono: string | null;
    avatarUrl: string | null;
  };

  /** Tickets que el usuario tiene como técnico y están en proceso. */
  ticketsEnProceso: Array<{
    id: number;
    titulo: string | null;
  }>;
};
