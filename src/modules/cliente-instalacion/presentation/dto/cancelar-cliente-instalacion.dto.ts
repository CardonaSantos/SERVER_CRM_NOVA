import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CancelarClienteInstalacionDto {
  @IsOptional()
  @IsString()
  motivo: string;
  @IsOptional()
  @IsString()
  observaciones?: string | null;
  @IsOptional()
  @IsDateString()
  fechaCancelacion?: Date;
}
