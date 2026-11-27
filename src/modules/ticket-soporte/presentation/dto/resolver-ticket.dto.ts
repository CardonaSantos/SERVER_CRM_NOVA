import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ResolverTicketDto {
  /** Solución del catálogo (opcional). */
  @IsOptional()
  @IsInt()
  @Min(1)
  solucionId?: number | null;

  /** Qué se hizo. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  resueltoComo?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notasInternas?: string | null;
}
