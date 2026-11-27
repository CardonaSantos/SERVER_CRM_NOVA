import { Inject, Injectable } from '@nestjs/common';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';
import {
  USUARIO_QUERY,
  UsuarioQueryPort,
} from '../../domain/ports/usuario-query.port';
import { UsuarioOpcion } from '../../domain/read-models/usuario-listado.read-model';

export type ListarOpcionesUsuarioInput = { roles?: RolUsuario[] };

/** Usuarios activos para elegir en un formulario (técnicos, cobradores…). */
@Injectable()
export class ListarOpcionesUsuarioUseCase {
  constructor(
    @Inject(USUARIO_QUERY) private readonly consultas: UsuarioQueryPort,
  ) {}

  execute(input: ListarOpcionesUsuarioInput): Promise<UsuarioOpcion[]> {
    return this.consultas.findOpciones(input.roles ?? []);
  }
}
