export type NotificationToEmit = {
  id: number; // ID de la notificación
  mensaje: string; // Mensaje de la notificación
  remitenteId: number; // ID del remitente
  tipoNotificacion: string; // Tipo de la notificación
  referenciaId?: number | null; // ID de referencia, puede ser nulo
  fechaCreacion: string; // Fecha de creación de la notificación
};
