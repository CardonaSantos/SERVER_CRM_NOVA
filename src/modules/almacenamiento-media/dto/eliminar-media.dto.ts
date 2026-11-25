// src/modules/media/application/dto/eliminar-media.dto.ts

export type EliminarMediaCommand = {
  id: number; // id de la fila media
  empresaId: number; // por seguridad multi-tenant
  hardDelete?: boolean; // opcional, true = borrar fila, false = soft delete
};

export type EliminarMediaResult = {
  id: number;
  eliminado: boolean;
};
