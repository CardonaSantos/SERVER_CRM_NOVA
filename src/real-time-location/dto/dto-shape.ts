export interface RealTimeLocationMapDto {
  usuarioId: number;
  latitud: number;
  longitud: number;
  precision: number;
  bateria?: number;
  velocidad?: number;
  actualizadoEn: Date;
  usuario: Usuario;
  ticketsEnProceso: {
    id: number;
    titulo: string;
  }[];
}

interface Usuario {
  nombre: string;
  rol: string;
  avatarUrl?: string;
  telefono: string;
}

// usuarioId: number;
//   latitud: number;
//   longitud: number;
//   precision: number;
//   velocidad: number;
//   bateria: number;
//   actualizadoEn: string;
//   usuario: UsuarioRaw;
