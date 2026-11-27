import { Inject, Injectable } from '@nestjs/common';
import {
  DireccionOrden,
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { EstadoUsuario } from '../../domain/enums/estado-usuario.enum';
import { OrdenUsuario } from '../../domain/enums/orden-usuario.enum';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';
import {
  USUARIO_QUERY,
  UsuarioQueryPort,
} from '../../domain/ports/usuario-query.port';
import { UsuarioListItem } from '../../domain/read-models/usuario-listado.read-model';

export type ListarUsuariosInput = {
  page?: number;
  limit?: number;
  search?: string;
  roles?: RolUsuario[];
  estados?: EstadoUsuario[];
  sortBy?: OrdenUsuario;
  sortDir?: DireccionOrden;
};

@Injectable()
export class ListarUsuariosUseCase {
  constructor(
    @Inject(USUARIO_QUERY) private readonly consultas: UsuarioQueryPort,
  ) {}

  execute(
    input: ListarUsuariosInput,
  ): Promise<ResultadoPaginado<UsuarioListItem>> {
    return this.consultas.findMany(
      {
        search: input.search,
        roles: input.roles,
        estados: input.estados,
        sortBy: input.sortBy,
        sortDir: input.sortDir,
      },
      normalizarPaginacion(input),
    );
  }
}
