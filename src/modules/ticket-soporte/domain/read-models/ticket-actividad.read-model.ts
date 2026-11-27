export type AutorActividad = {
  id: number | null;
  nombre: string;
  avatarUrl: string | null;
};

export type ComentarioActividad = {
  tipo: 'COMENTARIO';
  id: number;
  fecha: Date;
  autor: AutorActividad;
  texto: string;
  editadoEn: Date | null;
  imagenes: Array<{ id: number; url: string }>;
  eliminado: { fecha: Date; por: string | null } | null;
};

export type EventoActividad = {
  tipo: 'EVENTO';
  id: number;
  fecha: Date;
  autor: AutorActividad;
  /** Tipo de la bitácora (CREADO, ESTADO_CAMBIADO…). */
  evento: string;
  texto: string | null;
};

export type ActividadTicket = ComentarioActividad | EventoActividad;
