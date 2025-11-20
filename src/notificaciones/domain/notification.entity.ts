import {
  IsInt,
  IsOptional,
  IsString,
  IsEnum,
  IsUrl,
  IsDateString,
} from 'class-validator';
import {
  CategoriaNotificacion,
  SeveridadNotificacion,
  AudienciaNotificacion,
} from '@prisma/client';

export class CreateNotificacionDto {
  // Notificación ligada a una empresa (o null si es global)
  @IsOptional()
  @IsInt()
  empresaId?: number;

  // Contenido
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsString()
  mensaje: string;

  @IsOptional()
  @IsEnum(CategoriaNotificacion)
  categoria?: CategoriaNotificacion; // si no viene → OTROS (default Prisma)

  @IsOptional()
  @IsString()
  subtipo?: string; // 'FACTURAS_GENERADAS', 'PAGO_REGISTRADO', ...

  @IsOptional()
  @IsEnum(SeveridadNotificacion)
  severidad?: SeveridadNotificacion; // si no viene → INFO (default Prisma)

  @IsOptional()
  @IsUrl()
  url?: string;

  // Contexto de negocio
  @IsOptional()
  @IsString()
  referenciaTipo?: string; // 'TicketSoporte', 'FacturaInternet', ...

  @IsOptional()
  @IsInt()
  referenciaId?: number;

  @IsOptional()
  @IsString()
  route?: string; // ej: '/tickets/123'

  @IsOptional()
  @IsString()
  actionLabel?: string; // ej: 'Ver detalle'

  // Emisor / auditoría
  // Normalmente este lo sacas del JWT y NO del body,
  // pero lo dejo aquí por si decides mapearlo desde el controller.
  @IsOptional()
  @IsInt()
  remitenteId?: number;

  @IsOptional()
  @IsEnum(AudienciaNotificacion)
  audiencia?: AudienciaNotificacion; // default USUARIOS

  // Fechas opcionales
  @IsOptional()
  @IsDateString()
  visibleDesde?: string;

  @IsOptional()
  @IsDateString()
  expiraEn?: string;

  @IsOptional()
  @IsDateString()
  programadaEn?: string;
}
