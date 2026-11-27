import { IsEnum, IsOptional } from 'class-validator';
import { ComoArreglo } from 'src/common/http/transformaciones-query';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';

export class OpcionesUsuarioQueryDto {
  /** Roles a incluir (`?roles=TECNICO&roles=COBRADOR`); sin filtro, todos */
  @IsOptional()
  @ComoArreglo()
  @IsEnum(RolUsuario, { each: true })
  roles?: RolUsuario[];
}
