import {
  AudienciaNotificacion,
  CategoriaNotificacion,
  SeveridadNotificacion,
} from '@prisma/client';

export class CreateNotificacionDto {
  // === Contexto ===
  empresaId?: number | null;
  remitenteId?: number | null;

  // === Contenido ===
  titulo?: string | null;
  mensaje!: string;

  categoria?: CategoriaNotificacion;
  subtipo?: string | null;
  severidad?: SeveridadNotificacion;

  // === Navegación ===
  url?: string | null;
  route?: string | null;
  actionLabel?: string | null;

  // === Referencia de negocio ===
  referenciaTipo?: string | null;
  referenciaId?: number | null;

  // === Audiencia ===
  audiencia?: AudienciaNotificacion;

  // === Programación / visibilidad ===
  visibleDesde?: Date | null;
  expiraEn?: Date | null;
  programadaEn?: Date | null;
}
