import { IsEnum, IsOptional } from 'class-validator';
import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import { ComoArreglo } from 'src/common/http/transformaciones-query';
import { EstadoUsuario } from '../../domain/enums/estado-usuario.enum';
import { OrdenUsuario } from '../../domain/enums/orden-usuario.enum';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';

/** `search` busca en nombre, correo y teléfono. */
export class ListarUsuariosQueryDto extends PaginacionQueryDto {
  /** Roles a incluir; sin filtro, todos */
  @IsOptional()
  @ComoArreglo()
  @IsEnum(RolUsuario, { each: true })
  roles?: RolUsuario[];

  /** Estados a incluir; sin filtro, activos e inactivos (no eliminados) */
  @IsOptional()
  @ComoArreglo()
  @IsEnum(EstadoUsuario, { each: true })
  estados?: EstadoUsuario[];

  /** Columna de orden; por defecto el nombre */
  @IsOptional()
  @IsEnum(OrdenUsuario)
  sortBy?: OrdenUsuario;
}
