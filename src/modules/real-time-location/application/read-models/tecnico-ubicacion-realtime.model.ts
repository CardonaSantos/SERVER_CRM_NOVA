import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';

type TecnicoUbicacionRealtime = {
  tecnico: {
    id: number;
    nombre: string;
    telefono?: string | null;
    rol: string;
    avatarUrl?: string | null;
  };

  tracking: {
    sesionId: number;
    estado: EstadoTrackingTecnico;
    iniciadoEn: Date;
    ultimoHeartbeatEn: Date;
  };

  ubicacion: {
    latitud: number;
    longitud: number;
    precision?: number | null;
    velocidad?: number | null;
    bateria?: number | null;
    capturadoEn: Date;
    recibidoEn: Date;
  };
};
