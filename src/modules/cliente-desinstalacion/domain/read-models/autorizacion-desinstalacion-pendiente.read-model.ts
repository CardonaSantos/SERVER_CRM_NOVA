import { AutorizacionDesinstalacionResumen } from './cliente-desinstalacion-resumen.read-model';

/** Solicitud de baja que espera aprobación, con lo que oficina necesita para decidir. */
export type AutorizacionDesinstalacionPendiente = {
  autorizacion: AutorizacionDesinstalacionResumen;

  solicitadoPor: {
    id: number;
    nombre: string;
  } | null;

  desinstalacion: {
    id: number;
    clienteId: number;
    servicioInternetId: number | null;
    tipo: string;
    motivo: string | null;
    estado: string;
    fechaProgramada: Date | null;
    observaciones: string | null;

    cliente: {
      id: number;
      nombre: string;
      apellidos: string | null;
      telefono: string | null;
      direccion: string | null;
    };

    servicioInternet: {
      id: number;
      nombre: string;
      velocidad: string | null;
      precio: number;
    } | null;
  };
};
